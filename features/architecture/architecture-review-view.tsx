'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Project } from '@/lib/types'

type Props = { projects: Project[] }

export function ArchitectureReviewView({ projects: _projects }: Props) {
  const router = useRouter()

  useEffect(() => {
    router.replace('/architecture')
  }, [router])

  return (
    <section className="bx-panel" aria-live="polite">
      <span className="bx-kicker">CAD · PRIMARY</span>
      <h2>جارٍ فتح مساحة Architecture…</h2>
      <p>DWG/DXF هو مسار الهندسة الأساسي. PDF والصور متاحة كمسار احتياطي.</p>
      <div className="bx-actions">
        <a href="/architecture">فتح DWG / DXF</a>
        <a href="/architecture/pdf-image">PDF / IMAGE FALLBACK</a>
      </div>
    </section>
  )
}
