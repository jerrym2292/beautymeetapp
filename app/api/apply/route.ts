import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyLicense } from "@/lib/licenseVerification";

const Category = z.enum(["NAILS", "LASHES_BROWS", "HAIR", "BRAIDS"]);

const Body = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(7).max(30),
  email: z.string().email().nullable().optional(),
  dob: z.string().nullable().optional(),

  // Legacy single-license fields (still accepted)
  licenseNumber: z.string().nullable().optional(),
  licenseState: z.string().nullable().optional(),
  licenseUrl: z.string().nullable().optional(),
  idUrl: z.string().nullable().optional(),

  // New multi-category application
  appliedCategories: z.array(Category).min(1).optional(),
  categoryLicenses: z
    .array(
      z.object({
        category: Category,
        licenseNumber: z.string().min(2).max(80),
        licenseState: z.string().min(2).max(2),
        licenseUrl: z.string().url().nullable().optional(),
      })
    )
    .optional(),

  // Hidden from public. Used for service area + future distance.
  address1: z.string().min(3).max(120).nullable().optional(),
  address2: z.string().max(120).nullable().optional(),
  city: z.string().min(2).max(80).nullable().optional(),
  state: z.string().min(2).max(2).nullable().optional(),
  zip: z.string().min(5).max(10).nullable().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid application details." },
      { status: 400 }
    );
  }

  const {
    fullName,
    phone,
    email,
    dob,
    licenseNumber,
    licenseState,
    licenseUrl,
    idUrl,
    appliedCategories,
    categoryLicenses,
    address1,
    address2,
    city,
    state,
    zip,
  } = parsed.data;

  // Normalize + validate multi-category licensing if provided.
  let appliedCategoriesJson: string | null = null;
  let categoryLicensesJson: string | null = null;

  if (appliedCategories && appliedCategories.length > 0) {
    const uniq = Array.from(new Set(appliedCategories));
    appliedCategoriesJson = JSON.stringify(uniq);

    const licenses = (categoryLicenses || []).map((l) => ({
      category: l.category,
      licenseNumber: l.licenseNumber,
      licenseState: l.licenseState.toUpperCase(),
      licenseUrl: l.licenseUrl ?? null,
    }));

    // Require one license record per applied category.
    for (const c of uniq) {
      const has = licenses.some(
        (l) => l.category === c && l.licenseNumber && l.licenseState
      );
      if (!has) {
        return NextResponse.json(
          { error: `Missing licensing details for ${c}.` },
          { status: 400 }
        );
      }
    }

    categoryLicensesJson = JSON.stringify(licenses);
  }

  const created = await prisma.providerApplication.create({
    data: {
      fullName,
      phone,
      email: email ?? null,
      dob: dob ? new Date(dob) : null,

      // legacy fields
      licenseNumber: licenseNumber ?? null,
      licenseState: licenseState ?? null,
      licenseUrl: licenseUrl ?? null,
      idUrl: idUrl ?? null,

      // new fields
      appliedCategoriesJson,
      categoryLicensesJson,

      address1: address1 ?? null,
      address2: address2 ?? null,
      city: city ?? null,
      state: state ?? null,
      zip: zip ?? null,

      verificationStatus: "IN_PROGRESS",
    },
    select: { id: true },
  });

  // Auto-verify (best-effort)
  const licenseList: Array<{ category: string; licenseNumber: string; licenseState: string }> =
    appliedCategoriesJson && categoryLicensesJson
      ? JSON.parse(categoryLicensesJson)
      : licenseNumber && licenseState
        ? [{ category: "LEGACY", licenseNumber, licenseState }]
        : [];

  const results = [] as any[];
  for (const l of licenseList) {
    const r = await verifyLicense(l.licenseState, l.licenseNumber, { fullName });
    results.push({ ...l, ...r });
  }

  const allValid = results.length > 0 && results.every((r) => r.valid);
  const anyLookupAttempted = results.length > 0;

  await prisma.providerApplication.update({
    where: { id: created.id },
    data: {
      verificationStatus: allValid
        ? "VERIFIED"
        : anyLookupAttempted
          ? "NEEDS_MANUAL"
          : null,
      verificationDetailsJson: results.length ? JSON.stringify(results) : null,
      verificationSourceJson: results.length
        ? JSON.stringify(
            results.map((r) => ({
              category: r.category,
              sourceUrl: r.sourceUrl ?? null,
            }))
          )
        : null,
      verifiedAt: allValid ? new Date() : null,
    },
  });

  // TODO: send SMS acknowledgement

  return NextResponse.json({ ok: true, id: created.id, verification: results });
}
