'use client'
import { useState } from 'react'
import { CreditCard, ReceiptText, ShieldCheck, WalletCards } from 'lucide-react'
import { useToast } from '@/components/cabinet/toast'
import { Button, Card, EmptyState, ErrorState, Modal, PageHeader, PageSkeleton, StatusBadge, Table, Td, Th } from '@/components/cabinet/ui'
import { Pager, usePager } from '@/components/cabinet/pager'
import { studentApi } from '@/lib/api/student'
import { fmtDate, fmtFullDate, fmtMoney, paymentLabel } from '@/lib/format'
import type { Payment } from '@/lib/types'
import { useApi } from '@/lib/use-api'
import { cn } from '@/lib/utils'

export default function StudentPaymentsPage() {
  const toast = useToast()
  const { data, error, loading, reload, setData } = useApi(studentApi.payments)
  const [paying, setPaying] = useState<Payment | null>(null)
  const [busy, setBusy] = useState(false)
  const pager = usePager(data?.items ?? [], 10)

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (loading || !data) return <PageSkeleton />

  const unpaid = data.items.filter((p) => p.status !== 'paid')
  const pay = async () => {
    if (!paying) return
    setBusy(true)
    try {
      setData(await studentApi.pay(paying.id))
      toast('Оплата прошла успешно')
      setPaying(null)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Ошибка оплаты', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Оплата обучения" subtitle="Ежемесячные платежи по вашим курсам" />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className={cn('relative overflow-hidden rounded-2xl p-6 text-white md:p-7', data.status === 'overdue' ? 'bg-danger' : 'bg-primary')}>
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gold/20" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/70">Текущий статус</p>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{paymentLabel[data.status][0]}</span>
            </div>
            {data.next_payment ? (
              <>
                <p className="mt-5 text-sm text-white/70">К оплате · {data.next_payment.period}</p>
                <p className="font-serif text-5xl">{fmtMoney(unpaid.reduce((s, p) => s + p.amount, 0))}</p>
                <p className="mt-2 text-sm text-white/70">Ближайший срок — {fmtFullDate(data.next_payment.due_date)}</p>
                <Button variant="gold" className="mt-6" onClick={() => setPaying(data.next_payment)}><CreditCard size={17} /> Оплатить {data.next_payment.course_name}</Button>
              </>
            ) : (
              <>
                <p className="mt-5 font-serif text-4xl">Всё оплачено</p>
                <p className="mt-2 text-sm text-white/70">Следующий счёт появится в начале месяца</p>
              </>
            )}
          </div>
        </div>
        <Card title="Тариф">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-surface p-4">
              <span className="text-sm text-muted">Ежемесячно за все курсы</span>
              <span className="font-serif text-2xl text-primary">{fmtMoney(data.monthly_total)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface p-4">
              <span className="text-sm text-muted">Задолженность</span>
              <span className={cn('font-serif text-2xl', data.total_debt ? 'text-danger' : 'text-primary')}>{fmtMoney(data.total_debt)}</span>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted"><ShieldCheck size={15} className="text-success" /> Оплата до 25 числа каждого месяца</p>
          </div>
        </Card>
      </div>

      {unpaid.length > 1 && (
        <Card title="Неоплаченные счета" className="mt-6">
          <div className="space-y-2">
            {unpaid.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3.5">
                <WalletCards size={19} className="text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-primary">{p.course_name}</p>
                  <p className="text-xs text-muted">{p.period} · до {fmtDate(p.due_date)}</p>
                </div>
                <StatusBadge status={p.status} map={paymentLabel} />
                <span className="w-28 text-right font-semibold text-primary">{fmtMoney(p.amount)}</span>
                <Button size="sm" onClick={() => setPaying(p)}>Оплатить</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="История платежей" className="mt-6">
        {data.items.length === 0 ? (
          <EmptyState icon={ReceiptText} title="Платежей пока нет" />
        ) : (
          <Table>
            <thead><tr><Th>Период</Th><Th>Курс</Th><Th>Сумма</Th><Th>Срок</Th><Th>Дата оплаты</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {pager.visible.map((p) => (
                <tr key={p.id} className="hover:bg-surface/60">
                  <Td className="font-medium text-primary">{p.period}</Td>
                  <Td>{p.course_name}</Td>
                  <Td className="font-semibold text-primary">{fmtMoney(p.amount)}</Td>
                  <Td className="text-muted">{fmtDate(p.due_date)}</Td>
                  <Td className="text-muted">{p.paid_at ? fmtDate(p.paid_at) : '—'}</Td>
                  <Td><StatusBadge status={p.status} map={paymentLabel} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pager page={pager.page} pageCount={pager.pageCount} onChange={pager.setPage} from={pager.from} to={pager.to} total={pager.total} />
      </Card>

      <Modal
        open={!!paying}
        onClose={() => setPaying(null)}
        title="Оплата"
        footer={<><Button variant="ghost" onClick={() => setPaying(null)}>Отмена</Button><Button onClick={pay} disabled={busy}>{busy ? 'Обработка…' : `Оплатить ${paying ? fmtMoney(paying.amount) : ''}`}</Button></>}
      >
        {paying && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted">Курс</span><span className="font-medium text-primary">{paying.course_name}</span></div>
            <div className="flex justify-between"><span className="text-muted">Период</span><span className="font-medium text-primary">{paying.period}</span></div>
            <div className="flex justify-between border-t border-line pt-3"><span className="text-muted">Итого</span><span className="font-serif text-2xl text-primary">{fmtMoney(paying.amount)}</span></div>
            <p className="rounded-xl bg-info-light p-3 text-xs text-info">Демо-режим: платёж будет отмечен как оплаченный без списания средств.</p>
          </div>
        )}
      </Modal>
    </>
  )
}
