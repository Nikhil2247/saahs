"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MessageSquare, Clock, AlertCircle } from "lucide-react"
import { submitGrievance } from "@/app/actions/grievances"

export type GrievanceDB = {
  id: string
  ticket_number: string
  title: string
  category: string
  description: string
  is_anonymous: boolean
  status: string
  created_at: string
}

export function HelpDeskClient({ grievances }: { grievances: GrievanceDB[] }) {
  const [showForm, setShowForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const result = await submitGrievance(formData)
    
    setIsSubmitting(false)
    if (result.success) {
      setSubmitted(true)
      setTicketId(result.ticket_number || null)
      e.currentTarget.reset()
      
      setTimeout(() => {
        setSubmitted(false)
        setShowForm(false)
        setTicketId(null)
      }, 5000)
    } else {
      alert("Error submitting grievance: " + result.error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle2 className="size-4 text-green-600" />
      case "In Review":
        return <Clock className="size-4 text-blue-600" />
      case "Open":
        return <AlertCircle className="size-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-300"
      case "In Review":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "Open":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      default:
        return ""
    }
  }

  return (
    <>
      {submitted && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="size-5 text-green-600" />
            <p>Grievance submitted successfully!</p>
          </div>
          <p className="mt-2 text-sm text-green-800">
            Your ticket number is <strong className="font-mono">{ticketId}</strong>. 
            Please save this number to track your grievance status.
          </p>
        </div>
      )}

      {!showForm && !submitted && (
        <div className="mb-8 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <MessageSquare className="mx-auto mb-4 size-10 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold text-foreground">Have an issue or suggestion?</h3>
          <p className="mb-6 text-muted-foreground max-w-md mx-auto">
            Our help desk is monitored daily by the SAAHS council. You can choose to remain anonymous if you prefer.
          </p>
          <Button
            onClick={() => setShowForm(true)}
            size="lg"
            className="inline-flex items-center gap-2"
          >
            <MessageSquare className="size-4" />
            Submit a Grievance
          </Button>
        </div>
      )}

      {showForm && (
        <div className="mb-8 rounded-lg border border-border bg-card p-6">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Submit Your Grievance</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                required
                placeholder="Brief title of your grievance"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Academic">Academic</option>
                <option value="Hostel & Accommodation">Hostel & Accommodation</option>
                <option value="Stipend & Finance">Stipend & Finance</option>
                <option value="Harassment & Ragging">Harassment & Ragging</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={5}
                required
                placeholder="Please describe your issue in detail..."
                className="w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              />
            </div>

            <div className="pt-2 pb-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="anonymous"
                  value="true"
                  className="size-4 rounded border-input text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-foreground">
                  Submit Anonymously
                </span>
              </label>
              <p className="mt-1 ml-7 text-xs text-muted-foreground">
                Your identity will be hidden from the council.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Grievance"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h2 className="mb-6 text-2xl font-bold text-foreground">Recent Public Tickets</h2>
        <div className="space-y-4">
          {grievances.map((grievance) => (
            <div
              key={grievance.id}
              className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{grievance.title}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="font-mono text-xs text-muted-foreground">
                      Ticket #{grievance.ticket_number}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{new Date(grievance.created_at).toLocaleDateString()}</span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="font-medium text-foreground/80">
                      {grievance.is_anonymous ? "Anonymous Student" : "Student Member"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">{grievance.category}</Badge>
                  <Badge className={`gap-1.5 ${getStatusColor(grievance.status)}`}>
                    {getStatusIcon(grievance.status)}
                    {grievance.status}
                  </Badge>
                </div>
              </div>
              
              <div className="mt-4 rounded-md bg-secondary/50 p-4">
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {grievance.description}
                </p>
              </div>
            </div>
          ))}
          {grievances.length === 0 && (
            <div className="rounded-lg border border-dashed border-border py-12 text-center text-muted-foreground">
              No recent public tickets.
            </div>
          )}
        </div>
      </div>
    </>
  )
}
