'use client'

import type React from 'react'

import { useState, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Heart,
  MapPin,
  Maximize2,
  Minimize2,
  Phone,
  Plus,
  Stethoscope,
  Minus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

// Add Google Maps types
declare global {
  interface Window {
    google: typeof google
  }
}

export function DashboardView() {
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  return (
    <div className="h-[calc(100vh-40px)] p-1 md:p-2 overflow-hidden">
      <div className="grid h-full grid-cols-12 gap-2">
        {/* Main Dashboard Content - Left side */}
        <div className="col-span-8 grid grid-rows-[auto_auto_1fr_auto] gap-2">
          {/* Live Incident Overview Card */}
          <IncidentOverviewCard />

          {/* AI Suggestions Panel */}
          <AISuggestionsPanel />

          {/* Map View */}
          <MapViewPanel
            isExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
          />

          {/* Hotlines & Support Panel */}
          <HotlinesPanel />
        </div>

        {/* Right Sidebar - Case Memory Panel */}
        <div className="col-span-4">
          <CaseMemoryPanel />
        </div>
      </div>

      {/* After Call Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {/* Floating Action Button to End Call and Show Report */}
      <Button
        className="fixed bottom-4 right-4 h-10 w-10 rounded-full bg-red-500 p-0 text-white shadow-lg hover:bg-red-600"
        onClick={() => setIsReportModalOpen(true)}
      >
        <Phone className="h-4 w-4" />
        <span className="sr-only">End Call</span>
      </Button>
    </div>
  )
}

function IncidentOverviewCard() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-2 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Live Incident Overview</CardTitle>
            <CardDescription className="text-xs">
              Ongoing emergency call - 00:12:45
            </CardDescription>
          </div>
          <Badge className="bg-red-500 text-xs text-white hover:bg-red-600">
            High Risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-2 pt-0">
        {/* Client Info Summary */}
        <div className="rounded-md bg-muted p-2">
          <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="text-xs font-medium">Sarah Thompson</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="text-xs font-medium">42</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Emergency Type</p>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                <p className="text-xs font-medium">Cardiac</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Known Conditions</p>
              <p className="text-xs font-medium">Hypertension</p>
            </div>
          </div>
        </div>

        {/* Live Transcription */}
        <div className="max-h-24 space-y-1 overflow-y-auto rounded-md bg-muted/50 p-2 text-xs">
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className="shrink-0 bg-background px-1 py-0 text-[10px]"
            >
              Caller
            </Badge>
            <p>
              She's having chest pain and difficulty breathing. It started about
              20 minutes ago.
            </p>
          </div>
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className="shrink-0 bg-background px-1 py-0 text-[10px]"
            >
              You
            </Badge>
            <p>
              Is she conscious and responsive? Can you check if her lips or
              fingertips are turning blue?
            </p>
          </div>
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className="shrink-0 bg-background px-1 py-0 text-[10px]"
            >
              Caller
            </Badge>
            <p>
              Yes, she's awake but very uncomfortable. Her lips look normal but
              she says the pain is spreading to her left arm now.
            </p>
          </div>
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className="shrink-0 bg-background px-1 py-0 text-[10px]"
            >
              You
            </Badge>
            <p>
              That could indicate a heart attack. Help is on the way. Can you
              help her into a comfortable position, preferably sitting upright?
            </p>
          </div>
          <div className="flex gap-1">
            <Badge
              variant="outline"
              className="shrink-0 bg-background px-1 py-0 text-[10px]"
            >
              Caller
            </Badge>
            <p className="text-teal-500">...</p>
          </div>
        </div>

        {/* Risk Tags */}
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-red-500/50 text-[10px] text-red-500"
          >
            <Heart className="h-2 w-2" />
            <span>Cardiac</span>
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-yellow-500/50 text-[10px] text-yellow-500"
          >
            <AlertTriangle className="h-2 w-2" />
            <span>Urgent</span>
          </Badge>
          <Badge
            variant="outline"
            className="flex items-center gap-1 border-muted-foreground/50 text-[10px]"
          >
            <Clock className="h-2 w-2" />
            <span>Response ETA: 4 min</span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function AISuggestionsPanel() {
  return (
    <Card>
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-sm">AI Suggestions</CardTitle>
        <CardDescription className="text-xs">
          Recommended actions based on current situation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 p-2 pt-0">
        <div className="grid grid-cols-2 gap-1">
          <div className="flex items-start gap-1">
            <Checkbox
              id="suggestion-1"
              className="mt-0.5 h-3 w-3 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
            />
            <div className="grid gap-0">
              <label htmlFor="suggestion-1" className="text-xs font-medium">
                Ask about medication history
              </label>
              <p className="text-[10px] text-muted-foreground">
                Specifically inquire about blood thinners or heart medication
              </p>
            </div>
          </div>

          <div className="flex items-start gap-1">
            <Checkbox
              id="suggestion-2"
              className="mt-0.5 h-3 w-3 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
            />
            <div className="grid gap-0">
              <label htmlFor="suggestion-2" className="text-xs font-medium">
                Instruct to provide aspirin if available
              </label>
              <p className="text-[10px] text-muted-foreground">
                One adult aspirin (325mg) or 4 baby aspirin (81mg each)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-1">
            <Checkbox
              id="suggestion-3"
              className="mt-0.5 h-3 w-3 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
            />
            <div className="grid gap-0">
              <label htmlFor="suggestion-3" className="text-xs font-medium">
                Check for allergies
              </label>
              <p className="text-[10px] text-muted-foreground">
                Confirm any known drug allergies before suggesting medication
              </p>
            </div>
          </div>

          <div className="flex items-start gap-1">
            <Checkbox
              id="suggestion-4"
              className="mt-0.5 h-3 w-3 data-[state=checked]:bg-teal-500 data-[state=checked]:text-white"
            />
            <div className="grid gap-0">
              <label htmlFor="suggestion-4" className="text-xs font-medium">
                Monitor breathing pattern
              </label>
              <p className="text-[10px] text-muted-foreground">
                Ask caller to describe breathing - rapid, shallow, labored
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          className="h-6 w-full gap-1 border-dashed text-xs"
        >
          <Plus className="h-3 w-3" />
          <span>Add custom action</span>
        </Button>
      </CardFooter>
    </Card>
  )
}

interface MapViewPanelProps {
  isExpanded: boolean
  onToggleExpand: () => void
}

interface Facility {
  name: string
  type: 'hospital' | 'medical_center' | 'urgent_care'
  distance: string
  eta: string
  position: {
    lat: number
    lng: number
  }
  address?: string
  rating?: number
  distanceValue: number
}

const UC_BERKELEY_COORDS = {
  lat: 37.8716,
  lng: -122.2727,
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function MapViewPanel({ isExpanded, onToggleExpand }: MapViewPanelProps) {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  // Initialize with fallback data immediately
  useEffect(() => {
    const fallbackData: Facility[] = [
      {
        name: 'UC Berkeley Medical Center',
        type: 'hospital',
        distance: '0.5 miles',
        eta: '2 min',
        position: { lat: 37.8642, lng: -122.2688 }, // Herrick Campus
        address: '2001 Dwight Way, Berkeley, CA',
        distanceValue: calculateDistance(
          UC_BERKELEY_COORDS.lat,
          UC_BERKELEY_COORDS.lng,
          37.8642,
          -122.2688
        ),
      },
      {
        name: 'Alta Bates Summit Medical Center',
        type: 'hospital',
        distance: '1.2 miles',
        eta: '4 min',
        position: { lat: 37.8584, lng: -122.2595 }, // Ashby Campus
        address: '2450 Ashby Ave, Berkeley, CA',
        distanceValue: calculateDistance(
          UC_BERKELEY_COORDS.lat,
          UC_BERKELEY_COORDS.lng,
          37.8584,
          -122.2595
        ),
      },
      {
        name: 'Kaiser Permanente Oakland',
        type: 'hospital',
        distance: '2.1 miles',
        eta: '6 min',
        position: { lat: 37.8249, lng: -122.2612 },
        address: '3600 Broadway, Oakland, CA',
        distanceValue: calculateDistance(
          UC_BERKELEY_COORDS.lat,
          UC_BERKELEY_COORDS.lng,
          37.8249,
          -122.2612
        ),
      },
      {
        name: "UCSF Benioff Children's Hospital",
        type: 'hospital',
        distance: '2.8 miles',
        eta: '8 min',
        position: { lat: 37.8378, lng: -122.2678 },
        address: '747 52nd St, Oakland, CA',
        distanceValue: calculateDistance(
          UC_BERKELEY_COORDS.lat,
          UC_BERKELEY_COORDS.lng,
          37.8378,
          -122.2678
        ),
      },
      {
        name: 'Berkeley Urgent Care',
        type: 'urgent_care',
        distance: '0.8 miles',
        eta: '3 min',
        position: { lat: 37.8562, lng: -122.2673 },
        address: '2999 Telegraph Ave, Berkeley, CA',
        distanceValue: calculateDistance(
          UC_BERKELEY_COORDS.lat,
          UC_BERKELEY_COORDS.lng,
          37.8562,
          -122.2673
        ),
      },
    ]

    // Set fallback data immediately
    setFacilities(fallbackData)

    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => setMapLoaded(true)
      document.head.appendChild(script)
    }

    loadGoogleMaps()
  }, [])

  // Initialize map when loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: UC_BERKELEY_COORDS.lat, lng: UC_BERKELEY_COORDS.lng },
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }],
        },
        {
          elementType: 'labels.icon',
          stylers: [{ visibility: 'off' }],
        },
        {
          elementType: 'labels.text.fill',
          stylers: [{ color: '#616161' }],
        },
        {
          elementType: 'labels.text.stroke',
          stylers: [{ color: '#f5f5f5' }],
        },
        {
          featureType: 'administrative.land_parcel',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#eeeeee' }],
        },
        {
          featureType: 'poi',
          elementType: 'labels.text',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#e5e5e5' }],
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9e9e9e' }],
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }],
        },
        {
          featureType: 'road.arterial',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#757575' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#dadada' }],
        },
        {
          featureType: 'road.highway',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#616161' }],
        },
        {
          featureType: 'road.local',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'transit.line',
          elementType: 'geometry',
          stylers: [{ color: '#e5e5e5' }],
        },
        {
          featureType: 'transit.station',
          elementType: 'geometry',
          stylers: [{ color: '#eeeeee' }],
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#c9c9c9' }],
        },
        {
          featureType: 'water',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#9e9e9e' }],
        },
      ],
    })

    mapInstanceRef.current = map

    // Add UC Berkeley marker
    new google.maps.Marker({
      position: { lat: UC_BERKELEY_COORDS.lat, lng: UC_BERKELEY_COORDS.lng },
      map: map,
      title: 'UC Berkeley',
      icon: {
        url:
          'data:image/svg+xml;charset=UTF-8,' +
          encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#14b8a6"/>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="white"/>
            <circle cx="12" cy="9" r="2.5" fill="#14b8a6"/>
          </svg>
        `),
        scaledSize: new google.maps.Size(24, 24),
        anchor: new google.maps.Point(12, 12),
      },
    })
  }, [mapLoaded])

  // Add facility markers when facilities change
  useEffect(() => {
    if (!mapInstanceRef.current || facilities.length === 0) return

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current = []

    facilities.forEach((facility, index) => {
      const position = {
        lat:
          facility.position.lat ||
          UC_BERKELEY_COORDS.lat + (Math.random() - 0.5) * 0.01,
        lng:
          facility.position.lng ||
          UC_BERKELEY_COORDS.lng + (Math.random() - 0.5) * 0.01,
      }

      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: facility.name,
        icon: {
          url:
            'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="15" fill="#f44336" stroke="white" stroke-width="2"/>
                <path d="M16 8v16m-8-8h16" stroke="white" stroke-width="2" stroke-linecap="round"/>
              </svg>
            `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="color: #212529; padding: 8px; font-family: sans-serif;">
            <div style="font-weight: 700; font-size: 16px; margin-bottom: 5px;">${facility.name}</div>
            <div style="font-size: 14px; color: #495057; margin-bottom: 2px;">${facility.distance} away</div>
            <div style="font-size: 14px; color: #495057;">ETA: ${facility.eta}</div>
          </div>
        `,
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })
  }, [facilities, mapLoaded])

  // This useEffect fetches the facility data
  useEffect(() => {
    const tryFetchRealData = async () => {
      setLoading(true)
      try {
        const response = await fetch(
          `/api/hospitals?lat=${UC_BERKELEY_COORDS.lat}&lng=${UC_BERKELEY_COORDS.lng}&radius=5000`
        )
        const data = await response.json()

        if (data.status === 'OK' && data.results.length > 0) {
          const realData: Facility[] = data.results
            .slice(0, 8)
            .map((place: any) => {
              const distance = calculateDistance(
                UC_BERKELEY_COORDS.lat,
                UC_BERKELEY_COORDS.lng,
                place.geometry.location.lat,
                place.geometry.location.lng
              )
              return {
                name: place.name,
                type: place.types?.includes('hospital')
                  ? 'hospital'
                  : place.types?.includes('health')
                  ? 'medical_center'
                  : 'urgent_care',
                distance: `${distance.toFixed(1)} miles`,
                eta: `${Math.round(distance * 2)} min`,
                position: {
                  lat: place.geometry.location.lat,
                  lng: place.geometry.location.lng,
                },
                address: place.vicinity,
                rating: place.rating,
                distanceValue: distance,
              }
            })
            .sort(
              (a: Facility, b: Facility) => a.distanceValue - b.distanceValue
            )
          setFacilities(realData)
        }
      } catch (error) {
        console.error('Failed to fetch hospital data:', error)
        // Keep fallback data if API fails
      } finally {
        setLoading(false)
      }
    }

    tryFetchRealData()
  }, [])

  return (
    <Card
      className={cn(
        'flex flex-col',
        isExpanded ? 'fixed inset-0 z-50 h-screen w-screen' : ''
      )}
    >
      <CardHeader className="p-2 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Map View</CardTitle>
            <CardDescription className="text-xs">
              Nearby emergency facilities in Berkeley
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleExpand}
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 pt-0">
        <div className="relative h-full rounded-md overflow-hidden">
          {!mapLoaded ? (
            <div className="h-full w-full bg-muted flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading map...</p>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <div
                ref={mapRef}
                className="h-full w-full rounded-md"
                style={{
                  minHeight: isExpanded ? 'calc(100vh - 120px)' : '200px',
                }}
              />

              {/* Sidebar with top 5 facilities - always visible */}
              {facilities.length > 0 && (
                <div
                  className={`absolute top-4 right-4 bg-white rounded-lg shadow-lg border p-4 overflow-y-auto ${
                    isExpanded
                      ? 'w-80 max-h-[calc(100vh-140px)]'
                      : 'w-64 max-h-[calc(100%-32px)]'
                  }`}
                >
                  <h3
                    className={`font-semibold mb-3 text-gray-800 ${
                      isExpanded ? 'text-lg' : 'text-sm'
                    }`}
                  >
                    Top 5 Emergency Facilities
                  </h3>
                  <div className="space-y-2">
                    {facilities.slice(0, 5).map((facility, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-shrink-0 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className={`font-medium text-gray-900 leading-tight mb-1 ${
                              isExpanded ? 'text-sm' : 'text-xs'
                            }`}
                          >
                            {facility.name}
                          </h4>
                          <p className="text-xs text-gray-600 mb-1">
                            {facility.address || 'Address not available'}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-700">
                              <strong>{facility.distance}</strong> away
                            </span>
                            <span className="text-blue-600 font-medium">
                              ETA: <strong>{facility.eta}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function HotlinesPanel() {
  return (
    <Card>
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-sm">Hotlines & Support</CardTitle>
        <CardDescription className="text-xs">
          Quick access to emergency resources
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <div className="grid grid-cols-3 gap-1">
          <Button
            variant="outline"
            className="h-auto justify-start gap-1 border-red-500/20 bg-red-500/10 px-2 py-1 text-left hover:bg-red-500/20"
          >
            <Heart className="h-3 w-3 text-red-500" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium">Cardiac Center</span>
              <span className="text-[8px] text-muted-foreground">
                800-555-0123
              </span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-start gap-1 border-purple-500/20 bg-purple-500/10 px-2 py-1 text-left hover:bg-purple-500/20"
          >
            <Phone className="h-3 w-3 text-purple-500" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium">Mental Health</span>
              <span className="text-[8px] text-muted-foreground">
                800-555-0199
              </span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-start gap-1 border-blue-500/20 bg-blue-500/10 px-2 py-1 text-left hover:bg-blue-500/20"
          >
            <Stethoscope className="h-3 w-3 text-blue-500" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium">Poison Control</span>
              <span className="text-[8px] text-muted-foreground">
                800-555-0142
              </span>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function CaseMemoryPanel() {
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="text-sm">Case Memory</CardTitle>
        <CardDescription className="text-xs">
          Timeline of key facts collected
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-2.5rem)] overflow-y-auto p-2 pt-0">
        <div className="relative space-y-2 pl-4 text-xs before:absolute before:left-1 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-muted-foreground/20">
          {/* Timeline Items */}
          <TimelineItem time="00:01:23" label="Call initiated">
            <p className="text-[10px]">
              Emergency call received from Sarah Thompson's residence.
            </p>
          </TimelineItem>

          <TimelineItem
            time="00:02:45"
            label="Symptoms identified"
            isHighlighted
          >
            <p className="text-[10px]">
              Patient experiencing chest pain radiating to left arm and
              difficulty breathing.
            </p>
            <Badge
              variant="outline"
              className="mt-0.5 gap-1 border-red-500/50 px-1 py-0 text-[8px] text-red-500"
            >
              <Heart className="h-2 w-2" />
              <span>Cardiac</span>
            </Badge>
          </TimelineItem>

          <TimelineItem time="00:04:12" label="Medical history">
            <p className="text-[10px]">
              History of hypertension. Currently taking lisinopril 10mg daily.
            </p>
          </TimelineItem>

          <TimelineItem time="00:06:30" label="Vital signs" isHighlighted>
            <p className="text-[10px]">
              Conscious and alert. No cyanosis observed. Pain level reported as
              8/10.
            </p>
          </TimelineItem>

          <TimelineItem time="00:08:45" label="Action taken">
            <p className="text-[10px]">
              Advised to take aspirin 325mg. Caller confirmed no aspirin
              allergies.
            </p>
          </TimelineItem>

          <TimelineItem time="00:10:20" label="EMS dispatched">
            <p className="text-[10px]">
              Ambulance dispatched to location. ETA 4 minutes.
            </p>
          </TimelineItem>
        </div>
      </CardContent>
    </Card>
  )
}

interface TimelineItemProps {
  time: string
  label: string
  isHighlighted?: boolean
  children: React.ReactNode
}

function TimelineItem({
  time,
  label,
  isHighlighted = false,
  children,
}: TimelineItemProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          'absolute -left-[14px] flex h-3 w-3 items-center justify-center rounded-full border',
          isHighlighted
            ? 'border-teal-500 bg-teal-500/20'
            : 'border-muted-foreground/50 bg-background'
        )}
      >
        <Circle
          className={cn(
            'h-1 w-1',
            isHighlighted
              ? 'fill-teal-500 text-teal-500'
              : 'fill-muted-foreground/50 text-muted-foreground/50'
          )}
        />
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-muted-foreground">{time}</span>
          <span
            className={cn(
              'text-[10px] font-medium',
              isHighlighted ? 'text-teal-500' : ''
            )}
          >
            {label}
          </span>
        </div>
        <div className="rounded-md bg-muted/50 p-1">{children}</div>
      </div>
    </div>
  )
}

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
}

function ReportModal({ isOpen, onClose }: ReportModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Incident Report Summary
          </DialogTitle>
          <DialogDescription className="text-xs">
            Auto-generated report based on the call. Review and edit before
            submission.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary" className="text-xs">
              Summary
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs">
              Details
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-xs">
              Actions Taken
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-3 pt-3">
            <div className="rounded-md bg-muted p-3">
              <h3 className="mb-1 text-sm font-semibold">Incident Overview</h3>
              <p className="text-xs">
                42-year-old female patient experiencing symptoms consistent with
                acute myocardial infarction (heart attack). Patient reported
                chest pain radiating to left arm, difficulty breathing, and
                discomfort lasting approximately 20 minutes prior to the call.
                Patient has a history of hypertension and is currently taking
                lisinopril.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="mb-1 text-sm font-semibold">
                  Patient Information
                </h3>
                <div className="rounded-md bg-muted p-3">
                  <div className="grid gap-1">
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">Name:</p>
                      <p className="text-xs">Sarah Thompson</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">Age:</p>
                      <p className="text-xs">42</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">Location:</p>
                      <p className="text-xs">123 Main St, Apt 4B</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">
                        Medical History:
                      </p>
                      <p className="text-xs">Hypertension</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">
                        Medications:
                      </p>
                      <p className="text-xs">Lisinopril 10mg daily</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold">
                  Emergency Response
                </h3>
                <div className="rounded-md bg-muted p-3">
                  <div className="grid gap-1">
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">
                        Call Duration:
                      </p>
                      <p className="text-xs">14:23</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">
                        EMS Dispatched:
                      </p>
                      <p className="text-xs">Yes - 4 min response</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">
                        Hospital Notified:
                      </p>
                      <p className="text-xs">Memorial Hospital</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">
                        Risk Level:
                      </p>
                      <p className="text-xs">High - Cardiac</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-semibold">Responder Notes</h3>
              <Textarea
                placeholder="Add your notes here..."
                className="min-h-[80px] text-xs"
                defaultValue="Patient was conscious and responsive throughout the call. Advised caller to help patient into a comfortable sitting position and to take one adult aspirin after confirming no allergies. Caller was cooperative and followed instructions well."
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-3 pt-3">
            <div className="rounded-md bg-muted p-3">
              <h3 className="mb-1 text-sm font-semibold">Detailed Symptoms</h3>
              <ul className="list-inside list-disc space-y-0.5 text-xs">
                <li>Chest pain radiating to left arm</li>
                <li>Difficulty breathing</li>
                <li>Pain level reported as 8/10</li>
                <li>No cyanosis observed</li>
                <li>Conscious and alert throughout call</li>
                <li>Symptoms began approximately 20 minutes before call</li>
              </ul>
            </div>

            <div className="rounded-md bg-muted p-3">
              <h3 className="mb-1 text-sm font-semibold">
                Call Transcript Highlights
              </h3>
              <div className="space-y-1 text-xs">
                <p>
                  <strong>00:01:23</strong> - "She's having chest pain and
                  difficulty breathing. It started about 20 minutes ago."
                </p>
                <p>
                  <strong>00:04:12</strong> - "Yes, she's awake but very
                  uncomfortable. Her lips look normal but she says the pain is
                  spreading to her left arm now."
                </p>
                <p>
                  <strong>00:08:45</strong> - "I found some aspirin in the
                  medicine cabinet. It's 325mg. She's taking it now with water."
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-3 pt-3">
            <div className="rounded-md bg-muted p-3">
              <h3 className="mb-1 text-sm font-semibold">Actions Taken</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">
                    Advised caller to help patient into comfortable sitting
                    position
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">Confirmed no aspirin allergies</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">
                    Instructed to administer 325mg aspirin
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">Dispatched EMS to location</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">
                    Notified Memorial Hospital of incoming cardiac patient
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-muted p-3">
              <h3 className="mb-1 text-sm font-semibold">
                Follow-up Recommendations
              </h3>
              <div className="space-y-0.5 text-xs">
                <p>1. Cardiac evaluation and monitoring at hospital</p>
                <p>2. Review of current hypertension medication</p>
                <p>
                  3. Follow-up with primary care physician within 48 hours of
                  discharge
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <span>Export PDF</span>
            </Button>
            <Button
              size="sm"
              className="gap-1 bg-teal-500 text-xs text-white hover:bg-teal-600"
            >
              <span>Submit Report</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
