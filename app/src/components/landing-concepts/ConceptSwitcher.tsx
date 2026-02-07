import { useState } from 'react'
import { Concept14PrecisionAg } from './Concept14PrecisionAg'
import { Concept19MonochromeBrutalism } from './Concept19MonochromeBrutalism'
import { Concept20EarthTonesBrutalism } from './Concept20EarthTonesBrutalism'
import { Concept21HighContrastBrutalism } from './Concept21HighContrastBrutalism'
import { Concept22IndustrialBrutalism } from './Concept22IndustrialBrutalism'
import { Concept23SplitScreenBrutalism } from './Concept23SplitScreenBrutalism'
import { Concept24BrutalistMarketing } from './Concept24BrutalistMarketing'
import { Concept25ProbabilityField } from './Concept25ProbabilityField'
import { Concept26VoronoiEmergence } from './Concept26VoronoiEmergence'
import { Concept27GradientMesh } from './Concept27GradientMesh'
import { Concept28CycleConvergence } from './Concept28CycleConvergence'
import { Concept29MatrixOrganics } from './Concept29MatrixOrganics'

const concepts = [
  { id: 14, name: 'Original', component: Concept14PrecisionAg },
  { id: 19, name: 'Monochrome', component: Concept19MonochromeBrutalism },
  { id: 20, name: 'Earth Tones', component: Concept20EarthTonesBrutalism },
  { id: 21, name: 'High Contrast', component: Concept21HighContrastBrutalism },
  { id: 22, name: 'Industrial', component: Concept22IndustrialBrutalism },
  { id: 23, name: 'Split Screen', component: Concept23SplitScreenBrutalism },
  { id: 24, name: 'Marketing Page', component: Concept24BrutalistMarketing },
  { id: 25, name: 'Probability Field', component: Concept25ProbabilityField },
  { id: 26, name: 'Voronoi Emergence', component: Concept26VoronoiEmergence },
  { id: 27, name: 'Gradient Mesh', component: Concept27GradientMesh },
  { id: 28, name: 'Cycle Convergence', component: Concept28CycleConvergence },
  { id: 29, name: 'Matrix Organics', component: Concept29MatrixOrganics },
]

interface ConceptSwitcherProps {
  hideSwitcher?: boolean
  onToggleSwitcher?: (nextHidden: boolean) => void
}

export function ConceptSwitcher({ hideSwitcher }: ConceptSwitcherProps) {
  const [activeConcept, setActiveConcept] = useState(14)
  const ActiveComponent = concepts.find((c) => c.id === activeConcept)?.component || Concept14PrecisionAg

  return (
    <div className="relative min-h-screen">
      {/* Floating switcher */}
      {!hideSwitcher && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-white backdrop-blur-md rounded-full px-2 py-2 shadow-2xl border-2 border-gray-900/20">
          <div className="flex gap-1 flex-wrap max-w-4xl justify-center">
            {concepts.map((concept) => (
              <button
                key={concept.id}
                onClick={() => setActiveConcept(concept.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  activeConcept === concept.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {concept.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active concept */}
      <ActiveComponent />
    </div>
  )
}
