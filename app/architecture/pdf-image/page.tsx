'use client'

import { useEffect, useState } from 'react'
import { loadWorkspaceData } from '@/lib/data/workspace-service'
import type { Project } from '@/lib/types'
import { PdfImageReviewView } from '@/features/architecture/pdf-image-review-view'

export default function PdfImageFallbackPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void loadWorkspaceData().then((result) => {
      if (cancelled) return
      setProjects(result.data.projects)
    }).catch((reason: unknown) => {
      if (cancelled) return
      setError(reason instanceof Error ? reason.message : 'architecture.pdf_image.load_failed')
    })
    return () => { cancelled = true }
  }, [])

  if (error) return <main className="basoul-executive"><section className="bx-panel"><p>{error}</p></section></main>
  return <PdfImageReviewView projects={projects} />
}
