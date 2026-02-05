'use client'

import { useState } from 'react'
import { PlanProduct, updatePlanProduct } from '@/app/actions/commercial-plans'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TMRConfigProps {
  planProduct: PlanProduct
  onUpdate: () => void
}

export function TMRConfig({ planProduct, onUpdate }: TMRConfigProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    gross_ticket: planProduct.gross_ticket,
    payment_avista_pct: planProduct.payment_avista_pct * 100,
    payment_avista_recebimento: planProduct.payment_avista_recebimento * 100,
    payment_parcelado_pct: planProduct.payment_parcelado_pct * 100,
    payment_parcelado_recebimento: planProduct.payment_parcelado_recebimento * 100,
    payment_recorrente_pct: planProduct.payment_recorrente_pct * 100,
    payment_recorrente_recebimento: planProduct.payment_recorrente_recebimento * 100,
    refund_rate: planProduct.refund_rate * 100,
    chargeback_rate: planProduct.chargeback_rate * 100,
    default_rate: planProduct.default_rate * 100
  })

  // Calculate TMR in real-time
  const calculateTMR = () => {
    const fatorRecebimento =
      (formData.payment_avista_pct / 100) * (formData.payment_avista_recebimento / 100) +
      (formData.payment_parcelado_pct / 100) * (formData.payment_parcelado_recebimento / 100) +
      (formData.payment_recorrente_pct / 100) * (formData.payment_recorrente_recebimento / 100)

    const tmr =
      formData.gross_ticket *
      fatorRecebimento *
      (1 - formData.refund_rate / 100 - formData.chargeback_rate / 100 - formData.default_rate / 100)

    return tmr
  }

  const handleSave = async () => {
    setLoading(true)

    // Validate payment percentages sum to 100%
    const totalPayment = formData.payment_avista_pct + formData.payment_parcelado_pct + formData.payment_recorrente_pct
    if (Math.abs(totalPayment - 100) > 0.01) {
      toast({
        title: 'Erro',
        description: `Formas de pagamento devem somar 100% (atualmente ${totalPayment.toFixed(1)}%)`,
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    const { data, error } = await updatePlanProduct(planProduct.id, {
      gross_ticket: formData.gross_ticket,
      payment_avista_pct: formData.payment_avista_pct / 100,
      payment_avista_recebimento: formData.payment_avista_recebimento / 100,
      payment_parcelado_pct: formData.payment_parcelado_pct / 100,
      payment_parcelado_recebimento: formData.payment_parcelado_recebimento / 100,
      payment_recorrente_pct: formData.payment_recorrente_pct / 100,
      payment_recorrente_recebimento: formData.payment_recorrente_recebimento / 100,
      refund_rate: formData.refund_rate / 100,
      chargeback_rate: formData.chargeback_rate / 100,
      default_rate: formData.default_rate / 100
    })

    if (error) {
      toast({
        title: 'Erro',
        description: error,
        variant: 'destructive'
      })
      setLoading(false)
      return
    }

    toast({
      title: 'TMR atualizado!',
      description: 'Configuração do TMR salva com sucesso.'
    })

    onUpdate()
    setLoading(false)
  }

  const totalPayment = formData.payment_avista_pct + formData.payment_parcelado_pct + formData.payment_recorrente_pct

  return (
    <div className="space-y-6 pt-4">
      {/* Ticket Bruto */}
      <div className="space-y-2">
        <Label htmlFor="gross_ticket">Ticket Bruto (R$)</Label>
        <Input
          id="gross_ticket"
          type="number"
          step="0.01"
          value={formData.gross_ticket}
          onChange={(e) => setFormData({ ...formData, gross_ticket: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Formas de Pagamento</CardTitle>
          <CardDescription>
            Percentual e taxa de recebimento de cada forma (soma deve ser 100%)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>À Vista</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.payment_avista_pct}
                    onChange={(e) => setFormData({ ...formData, payment_avista_pct: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentual</p>
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.payment_avista_recebimento}
                    onChange={(e) => setFormData({ ...formData, payment_avista_recebimento: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recebimento</p>
                </div>
              </div>
              <p className="text-xs">
                = {(formData.payment_avista_pct * formData.payment_avista_recebimento / 100).toFixed(1)}%
              </p>
            </div>

            <div className="space-y-2">
              <Label>Parcelado</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.payment_parcelado_pct}
                    onChange={(e) => setFormData({ ...formData, payment_parcelado_pct: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentual</p>
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.payment_parcelado_recebimento}
                    onChange={(e) => setFormData({ ...formData, payment_parcelado_recebimento: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recebimento</p>
                </div>
              </div>
              <p className="text-xs">
                = {(formData.payment_parcelado_pct * formData.payment_parcelado_recebimento / 100).toFixed(1)}%
              </p>
            </div>

            <div className="space-y-2">
              <Label>Recorrente</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.payment_recorrente_pct}
                    onChange={(e) => setFormData({ ...formData, payment_recorrente_pct: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Percentual</p>
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="%"
                    value={formData.payment_recorrente_recebimento}
                    onChange={(e) => setFormData({ ...formData, payment_recorrente_recebimento: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Recebimento</p>
                </div>
              </div>
              <p className="text-xs">
                = {(formData.payment_recorrente_pct * formData.payment_recorrente_recebimento / 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm font-medium">Total Percentual:</span>
            <span className={`text-sm font-bold ${Math.abs(totalPayment - 100) > 0.01 ? 'text-destructive' : 'text-green-600'}`}>
              {totalPayment.toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ajustes</CardTitle>
          <CardDescription>Taxas que reduzem o valor final recebido</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="refund">Reembolso (%)</Label>
            <Input
              id="refund"
              type="number"
              step="0.1"
              value={formData.refund_rate}
              onChange={(e) => setFormData({ ...formData, refund_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chargeback">Chargeback (%)</Label>
            <Input
              id="chargeback"
              type="number"
              step="0.1"
              value={formData.chargeback_rate}
              onChange={(e) => setFormData({ ...formData, chargeback_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default">Inadimplência (%)</Label>
            <Input
              id="default"
              type="number"
              step="0.1"
              value={formData.default_rate}
              onChange={(e) => setFormData({ ...formData, default_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </CardContent>
      </Card>

      {/* TMR Calculado */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">TMR Calculado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <p>R$ {formData.gross_ticket.toFixed(2)} × {(
                (formData.payment_avista_pct / 100) * (formData.payment_avista_recebimento / 100) +
                (formData.payment_parcelado_pct / 100) * (formData.payment_parcelado_recebimento / 100) +
                (formData.payment_recorrente_pct / 100) * (formData.payment_recorrente_recebimento / 100)
              ).toFixed(3)} × (1 - {(formData.refund_rate + formData.chargeback_rate + formData.default_rate).toFixed(1)}%)</p>
            </div>
            <div className="text-3xl font-bold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculateTMR())}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salvar Configuração
        </Button>
      </div>
    </div>
  )
}
