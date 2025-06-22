"use client"

import type React from "react"

import { useState } from "react"
import {
  AlertTriangle,
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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

export function DashboardView() {
  const [isMapExpanded, setIsMapExpanded] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)

  return (
    <div className="container h-[calc(100vh-2.5rem)] p-1 md:p-2">
      <div className="grid h-full grid-cols-12 gap-2">
        {/* Main Dashboard Content - Left side */}
        <div className="col-span-8 grid grid-rows-[auto_auto_1fr_auto] gap-2">
          {/* Live Incident Overview Card */}
          <IncidentOverviewCard />

          {/* AI Suggestions Panel */}
          <AISuggestionsPanel />

          {/* Map View */}
          <MapViewPanel isExpanded={isMapExpanded} onToggleExpand={() => setIsMapExpanded(!isMapExpanded)} />

          {/* Hotlines & Support Panel */}
          <HotlinesPanel />
        </div>

        {/* Right Sidebar - Case Memory Panel */}
        <div className="col-span-4">
          <CaseMemoryPanel />
        </div>
      </div>

      {/* After Call Report Modal */}
      <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />

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
            <CardDescription className="text-xs">Ongoing emergency call - 00:12:45</CardDescription>
          </div>
          <Badge className="bg-red-500 text-xs text-white hover:bg-red-600">High Risk</Badge>
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
            <Badge variant="outline" className="shrink-0 bg-background px-1 py-0 text-[10px]">
              Caller
            </Badge>
            <p>She's having chest pain and difficulty breathing. It started about 20 minutes ago.</p>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="shrink-0 bg-background px-1 py-0 text-[10px]">
              You
            </Badge>
            <p>Is she conscious and responsive? Can you check if her lips or fingertips are turning blue?</p>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="shrink-0 bg-background px-1 py-0 text-[10px]">
              Caller
            </Badge>
            <p>
              Yes, she's awake but very uncomfortable. Her lips look normal but she says the pain is spreading to her
              left arm now.
            </p>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="shrink-0 bg-background px-1 py-0 text-[10px]">
              You
            </Badge>
            <p>
              That could indicate a heart attack. Help is on the way. Can you help her into a comfortable position,
              preferably sitting upright?
            </p>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="shrink-0 bg-background px-1 py-0 text-[10px]">
              Caller
            </Badge>
            <p className="text-teal-500">...</p>
          </div>
        </div>

        {/* Risk Tags */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="flex items-center gap-1 border-red-500/50 text-[10px] text-red-500">
            <Heart className="h-2 w-2" />
            <span>Cardiac</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 border-yellow-500/50 text-[10px] text-yellow-500">
            <AlertTriangle className="h-2 w-2" />
            <span>Urgent</span>
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 border-muted-foreground/50 text-[10px]">
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
        <CardDescription className="text-xs">Recommended actions based on current situation</CardDescription>
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
        <Button variant="outline" size="sm" className="h-6 w-full gap-1 border-dashed text-xs">
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

function MapViewPanel({ isExpanded, onToggleExpand }: MapViewPanelProps) {
  return (
    <Card className={cn("flex flex-col", isExpanded ? "col-span-full row-span-2" : "")}>
      <CardHeader className="p-2 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Map View</CardTitle>
            <CardDescription className="text-xs">Nearby emergency facilities</CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleExpand}>
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-2 pt-0">
        <div className={cn("relative h-full rounded-md bg-muted")}>
          <div className="absolute inset-0 flex items-center justify-center">
            <img
              src="/placeholder.svg?height=500&width=800"
              alt="Map view"
              className="h-full w-full rounded-md object-cover"
            />

            {/* Map Markers Overlay */}
            <div className="absolute inset-0">
              {/* Current Location */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500 text-white">
                  <MapPin className="h-3 w-3" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-1 py-0 text-[10px] font-medium text-white">
                  You
                </div>
              </div>

              {/* Hospital */}
              <div className="absolute left-[65%] top-[40%]">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white">
                  <Stethoscope className="h-2 w-2" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-red-500 px-1 py-0 text-[10px] font-medium text-white">
                  Memorial Hospital
                </div>
              </div>

              {/* Fire Station */}
              <div className="absolute left-[30%] top-[60%]">
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-white">
                  <Flame className="h-2 w-2" />
                </div>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-orange-500 px-1 py-0 text-[10px] font-medium text-white">
                  Fire Station #3
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Directions */}
        <div className="mt-1 rounded-md bg-muted p-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium">Memorial Hospital</p>
              <p className="text-[10px] text-muted-foreground">1.2 miles away</p>
            </div>
            <Badge variant="outline" className="gap-1 px-1 py-0 text-[10px]">
              <Clock className="h-2 w-2" />
              <span>ETA: 4 min</span>
            </Badge>
          </div>
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
        <CardDescription className="text-xs">Quick access to emergency resources</CardDescription>
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
              <span className="text-[8px] text-muted-foreground">800-555-0123</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-start gap-1 border-purple-500/20 bg-purple-500/10 px-2 py-1 text-left hover:bg-purple-500/20"
          >
            <Phone className="h-3 w-3 text-purple-500" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium">Mental Health</span>
              <span className="text-[8px] text-muted-foreground">800-555-0199</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="h-auto justify-start gap-1 border-blue-500/20 bg-blue-500/10 px-2 py-1 text-left hover:bg-blue-500/20"
          >
            <Stethoscope className="h-3 w-3 text-blue-500" />
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-medium">Poison Control</span>
              <span className="text-[8px] text-muted-foreground">800-555-0142</span>
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
        <CardDescription className="text-xs">Timeline of key facts collected</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-2.5rem)] overflow-y-auto p-2 pt-0">
        <div className="relative space-y-2 pl-4 text-xs before:absolute before:left-1 before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-muted-foreground/20">
          {/* Timeline Items */}
          <TimelineItem time="00:01:23" label="Call initiated">
            <p className="text-[10px]">Emergency call received from Sarah Thompson's residence.</p>
          </TimelineItem>

          <TimelineItem time="00:02:45" label="Symptoms identified" isHighlighted>
            <p className="text-[10px]">
              Patient experiencing chest pain radiating to left arm and difficulty breathing.
            </p>
            <Badge variant="outline" className="mt-0.5 gap-1 border-red-500/50 px-1 py-0 text-[8px] text-red-500">
              <Heart className="h-2 w-2" />
              <span>Cardiac</span>
            </Badge>
          </TimelineItem>

          <TimelineItem time="00:04:12" label="Medical history">
            <p className="text-[10px]">History of hypertension. Currently taking lisinopril 10mg daily.</p>
          </TimelineItem>

          <TimelineItem time="00:06:30" label="Vital signs" isHighlighted>
            <p className="text-[10px]">Conscious and alert. No cyanosis observed. Pain level reported as 8/10.</p>
          </TimelineItem>

          <TimelineItem time="00:08:45" label="Action taken">
            <p className="text-[10px]">Advised to take aspirin 325mg. Caller confirmed no aspirin allergies.</p>
          </TimelineItem>

          <TimelineItem time="00:10:20" label="EMS dispatched">
            <p className="text-[10px]">Ambulance dispatched to location. ETA 4 minutes.</p>
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

function TimelineItem({ time, label, isHighlighted = false, children }: TimelineItemProps) {
  return (
    <div className="relative">
      <div
        className={cn(
          "absolute -left-[14px] flex h-3 w-3 items-center justify-center rounded-full border",
          isHighlighted ? "border-teal-500 bg-teal-500/20" : "border-muted-foreground/50 bg-background",
        )}
      >
        <Circle
          className={cn(
            "h-1 w-1",
            isHighlighted ? "fill-teal-500 text-teal-500" : "fill-muted-foreground/50 text-muted-foreground/50",
          )}
        />
      </div>
      <div className="space-y-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[8px] text-muted-foreground">{time}</span>
          <span className={cn("text-[10px] font-medium", isHighlighted ? "text-teal-500" : "")}>{label}</span>
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
          <DialogTitle className="text-base">Incident Report Summary</DialogTitle>
          <DialogDescription className="text-xs">
            Auto-generated report based on the call. Review and edit before submission.
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
                42-year-old female patient experiencing symptoms consistent with acute myocardial infarction (heart
                attack). Patient reported chest pain radiating to left arm, difficulty breathing, and discomfort lasting
                approximately 20 minutes prior to the call. Patient has a history of hypertension and is currently
                taking lisinopril.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <h3 className="mb-1 text-sm font-semibold">Patient Information</h3>
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
                      <p className="text-xs text-muted-foreground">Medical History:</p>
                      <p className="text-xs">Hypertension</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">Medications:</p>
                      <p className="text-xs">Lisinopril 10mg daily</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-1 text-sm font-semibold">Emergency Response</h3>
                <div className="rounded-md bg-muted p-3">
                  <div className="grid gap-1">
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">Call Duration:</p>
                      <p className="text-xs">14:23</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">EMS Dispatched:</p>
                      <p className="text-xs">Yes - 4 min response</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">Hospital Notified:</p>
                      <p className="text-xs">Memorial Hospital</p>
                    </div>
                    <div className="grid grid-cols-2">
                      <p className="text-xs text-muted-foreground">Risk Level:</p>
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
              <h3 className="mb-1 text-sm font-semibold">Call Transcript Highlights</h3>
              <div className="space-y-1 text-xs">
                <p>
                  <strong>00:01:23</strong> - "She's having chest pain and difficulty breathing. It started about 20
                  minutes ago."
                </p>
                <p>
                  <strong>00:04:12</strong> - "Yes, she's awake but very uncomfortable. Her lips look normal but she
                  says the pain is spreading to her left arm now."
                </p>
                <p>
                  <strong>00:08:45</strong> - "I found some aspirin in the medicine cabinet. It's 325mg. She's taking it
                  now with water."
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
                  <p className="text-xs">Advised caller to help patient into comfortable sitting position</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">Confirmed no aspirin allergies</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">Instructed to administer 325mg aspirin</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">Dispatched EMS to location</p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-teal-500" />
                  <p className="text-xs">Notified Memorial Hospital of incoming cardiac patient</p>
                </div>
              </div>
            </div>

            <div className="rounded-md bg-muted p-3">
              <h3 className="mb-1 text-sm font-semibold">Follow-up Recommendations</h3>
              <div className="space-y-0.5 text-xs">
                <p>1. Cardiac evaluation and monitoring at hospital</p>
                <p>2. Review of current hypertension medication</p>
                <p>3. Follow-up with primary care physician within 48 hours of discharge</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1 text-xs">
              <span>Export PDF</span>
            </Button>
            <Button size="sm" className="gap-1 bg-teal-500 text-xs text-white hover:bg-teal-600">
              <span>Submit Report</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
