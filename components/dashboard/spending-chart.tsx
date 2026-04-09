"use client"

import { Cell, Pie, PieChart } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface SpendingChartProps {
  data: {
    name: string
    value: number
    fill: string
  }[]
}

export function SpendingChart({ data }: SpendingChartProps) {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.name] = {
      label: item.name,
      color: item.fill,
    }
    return acc
  }, {} as ChartConfig)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-0">
        <CardTitle>Spending by Category</CardTitle>
        <CardDescription>Where your money goes this month</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[280px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex items-center justify-between gap-4">
                      <span>{name}</span>
                      <span className="font-mono font-medium">
                        ₹{Number(value).toFixed(2)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-4 flex flex-wrap justify-center gap-4 pb-4">
          {data.slice(0, 5).map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="size-3 rounded-full"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
