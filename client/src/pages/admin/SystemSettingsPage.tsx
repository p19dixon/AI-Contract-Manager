import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Layout } from '../../components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Link } from 'wouter'
import { api } from '../../lib/api'

interface SystemSettings {
  companyName: string
  systemEmail: string
  supportEmail: string
  timezone: string
  dateFormat: string
  currency: string
  contractDefaults: {
    term: number
    billingCycle: string
    gracePeriodDays: number
  }
  emailNotifications: {
    contractExpiry: boolean
    paymentDue: boolean
    newCustomer: boolean
  }
  security: {
    passwordMinLength: number
    sessionTimeout: number
    twoFactorEnabled: boolean
    ipWhitelist: string[]
  }
}

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
]

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2023)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2023)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2023-12-31)' },
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY (31.12.2023)' }
]

const currencies = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'AUD', label: 'Australian Dollar (A$)' }
]

const billingCycles = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' }
]

export function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)
  const [ipInput, setIpInput] = useState('')

  const queryClient = useQueryClient()

  // Fetch settings
  const { data: settingsResponse, isLoading } = useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: () => api.get<SystemSettings>('/admin/settings')
  })

  const [settings, setSettings] = useState<SystemSettings | null>(null)

  useEffect(() => {
    if (settingsResponse) {
      setSettings(settingsResponse)
    }
  }, [settingsResponse])

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: (data: SystemSettings) => api.put('/admin/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      setHasChanges(false)
      alert('Settings saved successfully!')
    }
  })

  const handleSave = () => {
    if (settings) {
      updateSettingsMutation.mutate(settings)
    }
  }

  const updateSetting = (path: string, value: any) => {
    if (!settings) return

    const newSettings = { ...settings }
    const keys = path.split('.')
    let current: any = newSettings

    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    setSettings(newSettings)
    setHasChanges(true)
  }

  const addIpAddress = () => {
    if (!ipInput || !settings) return
    
    // Basic IP validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
    if (!ipRegex.test(ipInput)) {
      alert('Please enter a valid IP address')
      return
    }

    const newIps = [...settings.security.ipWhitelist, ipInput]
    updateSetting('security.ipWhitelist', newIps)
    setIpInput('')
  }

  const removeIpAddress = (ip: string) => {
    if (!settings) return
    const newIps = settings.security.ipWhitelist.filter(i => i !== ip)
    updateSetting('security.ipWhitelist', newIps)
  }

  if (isLoading || !settings) {
    return (
      <Layout title="System Settings">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="System Settings" description="Configure system-wide settings">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/admin">
                  <a className="text-gray-500 hover:text-gray-700">Admin</a>
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-4 text-gray-900 font-medium">System Settings</span>
                </div>
              </li>
            </ol>
          </nav>
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                Unsaved Changes
              </Badge>
            )}
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Admin
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="contracts">Contracts</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Basic company and system information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={settings.companyName}
                      onChange={(e) => updateSetting('companyName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemEmail">System Email</Label>
                    <Input
                      id="systemEmail"
                      type="email"
                      value={settings.systemEmail}
                      onChange={(e) => updateSetting('systemEmail', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) => updateSetting('supportEmail', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>Timezone, date format, and currency preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={settings.timezone} 
                      onValueChange={(value) => updateSetting('timezone', value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(value) => updateSetting('dateFormat', value)}
                    >
                      <SelectTrigger id="dateFormat">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFormats.map(format => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(value) => updateSetting('currency', value)}
                    >
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(currency => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contract Settings */}
          <TabsContent value="contracts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contract Defaults</CardTitle>
                <CardDescription>Default values for new contracts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractTerm">Default Term (months)</Label>
                    <Input
                      id="contractTerm"
                      type="number"
                      value={settings.contractDefaults.term}
                      onChange={(e) => updateSetting('contractDefaults.term', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingCycle">Default Billing Cycle</Label>
                    <Select 
                      value={settings.contractDefaults.billingCycle} 
                      onValueChange={(value) => updateSetting('contractDefaults.billingCycle', value)}
                    >
                      <SelectTrigger id="billingCycle">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {billingCycles.map(cycle => (
                          <SelectItem key={cycle.value} value={cycle.value}>
                            {cycle.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gracePeriod">Grace Period (days)</Label>
                    <Input
                      id="gracePeriod"
                      type="number"
                      value={settings.contractDefaults.gracePeriodDays}
                      onChange={(e) => updateSetting('contractDefaults.gracePeriodDays', parseInt(e.target.value))}
                    />
                    <p className="text-xs text-gray-500">Days after expiry before marking as late</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Configure automated email notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Contract Expiry Notifications</Label>
                      <p className="text-sm text-gray-500">Send email alerts before contracts expire</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications.contractExpiry}
                      onCheckedChange={(checked) => updateSetting('emailNotifications.contractExpiry', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Due Notifications</Label>
                      <p className="text-sm text-gray-500">Alert when payments are due</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications.paymentDue}
                      onCheckedChange={(checked) => updateSetting('emailNotifications.paymentDue', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>New Customer Notifications</Label>
                      <p className="text-sm text-gray-500">Notify staff when new customers register</p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications.newCustomer}
                      onCheckedChange={(checked) => updateSetting('emailNotifications.newCustomer', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Password Policy</CardTitle>
                <CardDescription>Configure password requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passwordLength">Minimum Password Length</Label>
                    <Input
                      id="passwordLength"
                      type="number"
                      value={settings.security.passwordMinLength}
                      onChange={(e) => updateSetting('security.passwordMinLength', parseInt(e.target.value))}
                      min="8"
                      max="32"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security.sessionTimeout', parseInt(e.target.value))}
                      min="5"
                      max="480"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Advanced Security</CardTitle>
                <CardDescription>Additional security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorEnabled}
                    onCheckedChange={(checked) => updateSetting('security.twoFactorEnabled', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>IP Whitelist</Label>
                  <p className="text-sm text-gray-500">Restrict access to specific IP addresses (leave empty to allow all)</p>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="192.168.1.1"
                      value={ipInput}
                      onChange={(e) => setIpInput(e.target.value)}
                    />
                    <Button onClick={addIpAddress} variant="outline">Add IP</Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {settings.security.ipWhitelist.map(ip => (
                      <div key={ip} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{ip}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeIpAddress(ip)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </Layout>
  )
}