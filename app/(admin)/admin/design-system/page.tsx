import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { H1, H2, H3, Lead, Muted, Text } from "@/components/ui/typography"

const colorTokens = [
  { label: "background", variable: "--background" },
  { label: "foreground", variable: "--foreground" },
  { label: "primary", variable: "--primary" },
  { label: "secondary", variable: "--secondary" },
  { label: "accent", variable: "--accent" },
  { label: "muted", variable: "--muted" },
  { label: "destructive", variable: "--destructive" },
  { label: "border", variable: "--border" },
  { label: "ring", variable: "--ring" },
]

const chartTokens = [
  { label: "chart-1", variable: "--chart-1" },
  { label: "chart-2", variable: "--chart-2" },
  { label: "chart-3", variable: "--chart-3" },
  { label: "chart-4", variable: "--chart-4" },
  { label: "chart-5", variable: "--chart-5" },
]

function ColorSwatch({ label, variable }: { label: string; variable: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-md border border-border"
        style={{ backgroundColor: `var(${variable})` }}
      />
      <div className="text-sm">
        <div className="font-medium text-foreground">{label}</div>
        <div className="text-xs text-muted-foreground">{variable}</div>
      </div>
    </div>
  )
}

export default function DesignSystemPage() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">UI Inventory</Badge>
          <Badge variant="outline">Admin</Badge>
        </div>
        <H1>Design System</H1>
        <Muted>Reference for tokens, components, and layout patterns used in the app.</Muted>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>Semantic tokens from globals.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {colorTokens.map((token) => (
                <ColorSwatch
                  key={token.variable}
                  label={token.label}
                  variable={token.variable}
                />
              ))}
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2">
              {chartTokens.map((token) => (
                <ColorSwatch
                  key={token.variable}
                  label={token.label}
                  variable={token.variable}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Scale and text treatments.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <H1>Heading 1</H1>
            <H2>Heading 2</H2>
            <H3>Heading 3</H3>
            <Text>
              Body text is optimized for readability with a balanced line height.
            </Text>
            <Lead>Supporting text uses muted tones for hierarchy.</Lead>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Buttons and badges</CardTitle>
            <CardDescription>Primary actions and status tags.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-wrap gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link</Button>
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Form controls</CardTitle>
            <CardDescription>Inputs and selection widgets.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ds-input">Input</Label>
              <Input id="ds-input" placeholder="Type here" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ds-textarea">Textarea</Label>
              <Textarea id="ds-textarea" placeholder="Add notes" />
            </div>
            <div className="grid gap-2">
              <Label>Select</Label>
              <Select defaultValue="weekly">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="ds-check" defaultChecked />
                <Label htmlFor="ds-check">Checkbox</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ds-switch" defaultChecked />
                <Label htmlFor="ds-switch">Switch</Label>
              </div>
              <RadioGroup defaultValue="option-1" className="grid gap-2">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option-1" id="ds-radio-1" />
                  <Label htmlFor="ds-radio-1">Radio option 1</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="option-2" id="ds-radio-2" />
                  <Label htmlFor="ds-radio-2">Radio option 2</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tabs</CardTitle>
            <CardDescription>Navigation for grouped content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="text-sm text-muted-foreground">
                Summary view with key metrics and context.
              </TabsContent>
              <TabsContent value="details" className="text-sm text-muted-foreground">
                Detailed view with deeper insights and data points.
              </TabsContent>
              <TabsContent value="activity" className="text-sm text-muted-foreground">
                Recent events, updates, and system actions.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Table</CardTitle>
            <CardDescription>Tabular data preview.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Enterprise</TableCell>
                  <TableCell>
                    <Badge variant="secondary">Stable</Badge>
                  </TableCell>
                  <TableCell className="text-right">82</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Mid-market</TableCell>
                  <TableCell>
                    <Badge>Growing</Badge>
                  </TableCell>
                  <TableCell className="text-right">74</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>SMB</TableCell>
                  <TableCell>
                    <Badge variant="outline">Watch</Badge>
                  </TableCell>
                  <TableCell className="text-right">61</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Feedback and status</CardTitle>
            <CardDescription>Alerts, progress, and avatars.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Alert>
              <AlertTitle>System message</AlertTitle>
              <AlertDescription>
                This is a standard alert with supporting text.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>Destructive alert</AlertTitle>
              <AlertDescription>
                Use this style for critical warnings or errors.
              </AlertDescription>
            </Alert>
            <div className="grid gap-2">
              <div className="text-sm font-medium">Progress</div>
              <Progress value={62} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar>
                <AvatarImage src="/next.svg" alt="Brand" />
                <AvatarFallback>CC</AvatarFallback>
              </Avatar>
              <Skeleton className="h-10 w-40" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>Short helper text</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
