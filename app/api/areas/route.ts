export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/areas - Get all areas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const includeRelations = searchParams.get("include");

    const areas = await prisma.area.findMany({
      where: status ? { status } : undefined,
      include: {
        sensors: includeRelations === "true",
        alarms: includeRelations === "true",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: areas,
      count: areas.length,
    });
  } catch (error) {
    console.error("Error fetching areas:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch areas",
      },
      { status: 500 }
    );
  }
}

// POST /api/areas - Create new area
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { areaId, name, latitude, longitude, status } = body;

    // Validation
    if (!areaId || !name || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: areaId, name, latitude, longitude",
        },
        { status: 400 }
      );
    }

    // Validate latitude range (-90 to 90)
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json(
        {
          success: false,
          error: "Latitude must be between -90 and 90",
        },
        { status: 400 }
      );
    }

    // Validate longitude range (-180 to 180)
    if (longitude < -180 || longitude > 180) {
      return NextResponse.json(
        {
          success: false,
          error: "Longitude must be between -180 and 180",
        },
        { status: 400 }
      );
    }

    // Check if areaId already exists
    const existingArea = await prisma.area.findUnique({
      where: { areaId },
    });

    if (existingArea) {
      return NextResponse.json(
        {
          success: false,
          error: "Area ID already exists",
        },
        { status: 409 }
      );
    }

    // Create area
    const area = await prisma.area.create({
      data: {
        areaId,
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        status: status || "Active",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: area,
        message: "Area created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating area:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create area",
      },
      { status: 500 }
    );
  }
}
