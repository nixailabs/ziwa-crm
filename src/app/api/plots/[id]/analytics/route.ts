import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const plotId = Number(id);

  const totals = await db.execute<{
    total_expense: string;
    total_income: string;
    expense_count: number;
    income_count: number;
  }>(sql`
    SELECT
      COALESCE(SUM(CASE WHEN f.kind='expense' THEN f.amount_egp ELSE 0 END),0) as total_expense,
      COALESCE(SUM(CASE WHEN f.kind='income' THEN f.amount_egp ELSE 0 END),0) as total_income,
      COALESCE(SUM(CASE WHEN f.kind='expense' THEN 1 ELSE 0 END),0)::int as expense_count,
      COALESCE(SUM(CASE WHEN f.kind='income' THEN 1 ELSE 0 END),0)::int as income_count
    FROM plot_stages s
    LEFT JOIN stage_financials f ON f.stage_id = s.id
    WHERE s.plot_id = ${plotId}
  `);

  const byStage = await db.execute<{
    stage_id: number;
    stage_name: string;
    status: string;
    expense: string;
    income: string;
  }>(sql`
    SELECT s.id as stage_id, s.name as stage_name, s.status,
      COALESCE(SUM(CASE WHEN f.kind='expense' THEN f.amount_egp ELSE 0 END),0) as expense,
      COALESCE(SUM(CASE WHEN f.kind='income' THEN f.amount_egp ELSE 0 END),0) as income
    FROM plot_stages s
    LEFT JOIN stage_financials f ON f.stage_id = s.id
    WHERE s.plot_id = ${plotId}
    GROUP BY s.id
    ORDER BY s.sort_order, s.id
  `);

  const byMonth = await db.execute<{
    month: string;
    expense: string;
    income: string;
  }>(sql`
    SELECT to_char(date_trunc('month', f.transaction_date), 'YYYY-MM') as month,
      COALESCE(SUM(CASE WHEN f.kind='expense' THEN f.amount_egp ELSE 0 END),0) as expense,
      COALESCE(SUM(CASE WHEN f.kind='income' THEN f.amount_egp ELSE 0 END),0) as income
    FROM stage_financials f
    JOIN plot_stages s ON s.id = f.stage_id
    WHERE s.plot_id = ${plotId}
    GROUP BY 1
    ORDER BY 1
  `);

  const byCategory = await db.execute<{
    category: string;
    expense: string;
  }>(sql`
    SELECT COALESCE(f.category, 'Uncategorized') as category,
      COALESCE(SUM(f.amount_egp),0) as expense
    FROM stage_financials f
    JOIN plot_stages s ON s.id = f.stage_id
    WHERE s.plot_id = ${plotId} AND f.kind='expense'
    GROUP BY 1
    ORDER BY 2 DESC
  `);

  const stages = await db.execute<{
    total: number;
    completed: number;
    in_progress: number;
    planned: number;
    on_hold: number;
  }>(sql`
    SELECT
      COUNT(*)::int as total,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END)::int as completed,
      SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END)::int as in_progress,
      SUM(CASE WHEN status='planned' THEN 1 ELSE 0 END)::int as planned,
      SUM(CASE WHEN status='on_hold' THEN 1 ELSE 0 END)::int as on_hold
    FROM plot_stages WHERE plot_id = ${plotId}
  `);

  return NextResponse.json({
    totals: totals.rows[0] || {
      total_expense: "0",
      total_income: "0",
      expense_count: 0,
      income_count: 0,
    },
    byStage: byStage.rows,
    byMonth: byMonth.rows,
    byCategory: byCategory.rows,
    stages: stages.rows[0] || {
      total: 0,
      completed: 0,
      in_progress: 0,
      planned: 0,
      on_hold: 0,
    },
  });
}
