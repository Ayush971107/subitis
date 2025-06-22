import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const radius = searchParams.get('radius') || '5000'

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      )
    }

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      )
    }

    // Fetch emergency hospitals specifically
    const emergencyHospitalResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=emergency+hospital+trauma+center&` +
        `location=${lat},${lng}&` +
        `radius=${radius}&` +
        `key=${apiKey}`
    )

    // Fetch urgent care centers
    const urgentCareResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?` +
        `query=urgent+care+emergency+care&` +
        `location=${lat},${lng}&` +
        `radius=${radius}&` +
        `key=${apiKey}`
    )

    const emergencyData = await emergencyHospitalResponse.json()
    const urgentCareData = await urgentCareResponse.json()

    let allPlaces: any[] = []

    if (emergencyData.status === 'OK') {
      allPlaces = [...allPlaces, ...emergencyData.results]
    }

    if (urgentCareData.status === 'OK') {
      allPlaces = [...allPlaces, ...urgentCareData.results]
    }

    // Remove duplicates based on place_id
    const uniquePlaces = allPlaces.filter(
      (place, index, self) =>
        index === self.findIndex((p) => p.place_id === place.place_id)
    )

    return NextResponse.json({
      status: 'OK',
      results: uniquePlaces.slice(0, 10),
    })
  } catch (error) {
    console.error('Error fetching emergency hospitals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emergency hospitals' },
      { status: 500 }
    )
  }
}
