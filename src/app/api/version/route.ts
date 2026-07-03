import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    app: 'ABD Finance',
    worker: 'abd-finale-smart-meening',
    adminPanelVersion: 'admin-panel-v2-d96129e',
    sourceRoot: 'ABD-finance-upload-clean',
  })
}
