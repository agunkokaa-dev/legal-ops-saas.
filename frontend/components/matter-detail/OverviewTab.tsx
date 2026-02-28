import ExecutiveSummary from './ExecutiveSummary'
import FinancialExposure from './FinancialExposure'
import AIRecommendedTasks from './AIRecommendedTasks'

export default function OverviewTab({ matterId, matterData, tasks }: { matterId: string, matterData: any, tasks: any[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 auto-rows-min">
            {/* Executive Summary (8 cols) */}
            <ExecutiveSummary matterId={matterId} initialDescription={matterData.description} />

            {/* Financial Exposure (4 cols) */}
            <FinancialExposure
                claimValue={matterData.claim_value}
                liabilityCap={matterData.liability_cap}
                legalSpend={matterData.legal_spend}
            />

            {/* AI Recommended Tasks (12 cols) */}
            <AIRecommendedTasks matterId={matterId} initialTasks={tasks} />
        </div>
    )
}
