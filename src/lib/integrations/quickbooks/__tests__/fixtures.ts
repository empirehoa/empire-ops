// SYNTHETIC FIXTURES. These are hand-built to match the documented shape of
// QuickBooks Online Reports API JSON (Header / Columns / Rows, Section rows with
// `group`, `Summary.ColData`). They are NOT real company data and NOT captured
// from a live QuickBooks file. All names and amounts are invented.

import type { QboReport } from '../report-parser'

const accountCols = {
  Column: [
    { ColTitle: '', ColType: 'Account', MetaData: [{ Name: 'ColKey', Value: 'account' }] },
    { ColTitle: 'Total', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'total' }] },
  ],
}

const header = (ReportName: string, start: string, end: string) => ({
  Time: '2026-10-08T02:00:00-04:00',
  ReportName,
  ReportBasis: 'Accrual',
  StartPeriod: start,
  EndPeriod: end,
  SummarizeColumnsBy: 'Total',
  Currency: 'USD',
  Option: [
    { Name: 'AccountingStandard', Value: 'GAAP' },
    { Name: 'NoReportData', Value: 'false' },
  ],
})

const data = (name: string, amount: string, id = '1') => ({
  ColData: [{ value: name, id }, { value: amount }],
  type: 'Data',
})

/** P&L, September 2026. Income 125,430.50; Expenses 98,210.25; Other income 1,200.00; Net 28,420.25. */
export const profitAndLossFixture: QboReport = {
  Header: header('ProfitAndLoss', '2026-09-01', '2026-09-30'),
  Columns: accountCols,
  Rows: {
    Row: [
      {
        Header: { ColData: [{ value: 'Income' }, { value: '' }] },
        Rows: {
          Row: [
            {
              // Nested parent account with sub-accounts; its own Summary must not be mistaken for the Income total.
              Header: { ColData: [{ value: 'Management Fees', id: '10' }, { value: '' }] },
              Rows: { Row: [data('Management Fees:Monthly', '110000.00', '11'), data('Management Fees:Onboarding', '5430.50', '12')] },
              Summary: { ColData: [{ value: 'Total Management Fees' }, { value: '115430.50' }] },
              type: 'Section',
            },
            data('Late Fee Income', '10000.00', '13'),
          ],
        },
        Summary: { ColData: [{ value: 'Total Income' }, { value: '125430.50' }] },
        type: 'Section',
        group: 'Income',
      },
      {
        Summary: { ColData: [{ value: 'Gross Profit' }, { value: '125430.50' }] },
        type: 'Section',
        group: 'GrossProfit',
      },
      {
        Header: { ColData: [{ value: 'Expenses' }, { value: '' }] },
        Rows: {
          Row: [
            data('Payroll Expenses', '81000.00', '20'),
            data('Rent or Lease', '12000.00', '21'),
            data('Software', '5210.25', '22'),
          ],
        },
        Summary: { ColData: [{ value: 'Total Expenses' }, { value: '98210.25' }] },
        type: 'Section',
        group: 'Expenses',
      },
      {
        Summary: { ColData: [{ value: 'Net Operating Income' }, { value: '27220.25' }] },
        type: 'Section',
        group: 'NetOperatingIncome',
      },
      {
        Header: { ColData: [{ value: 'Other Income' }, { value: '' }] },
        Rows: { Row: [data('Interest Earned', '1200.00', '30')] },
        Summary: { ColData: [{ value: 'Total Other Income' }, { value: '1200.00' }] },
        type: 'Section',
        group: 'OtherIncome',
      },
      {
        Summary: { ColData: [{ value: 'Net Other Income' }, { value: '1200.00' }] },
        type: 'Section',
        group: 'NetOtherIncome',
      },
      {
        Summary: { ColData: [{ value: 'Net Income' }, { value: '28420.25' }] },
        type: 'Section',
        group: 'NetIncome',
      },
    ],
  },
}

/** P&L with a net loss, summarised by month: the Total column is last, not the first Money column. */
export const profitAndLossByMonthFixture: QboReport = {
  Header: { ...header('ProfitAndLoss', '2026-08-01', '2026-09-30'), SummarizeColumnsBy: 'Month' },
  Columns: {
    Column: [
      { ColTitle: '', ColType: 'Account', MetaData: [{ Name: 'ColKey', Value: 'account' }] },
      { ColTitle: 'Aug 2026', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'Aug 2026' }] },
      { ColTitle: 'Sep 2026', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'Sep 2026' }] },
      { ColTitle: 'Total', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'total' }] },
    ],
  },
  Rows: {
    Row: [
      {
        Summary: { ColData: [{ value: 'Total Income' }, { value: '1000.00' }, { value: '2000.00' }, { value: '3000.00' }] },
        type: 'Section',
        group: 'Income',
      },
      {
        Summary: { ColData: [{ value: 'Total Expenses' }, { value: '2500.00' }, { value: '1750.75' }, { value: '4250.75' }] },
        type: 'Section',
        group: 'Expenses',
      },
      {
        Summary: { ColData: [{ value: 'Net Income' }, { value: '-1500.00' }, { value: '249.25' }, { value: '-1250.75' }] },
        type: 'Section',
        group: 'NetIncome',
      },
    ],
  },
}

/** A period with no transactions: QuickBooks flags NoReportData and returns no rows. */
export const emptyProfitAndLossFixture: QboReport = {
  Header: {
    ...header('ProfitAndLoss', '2026-10-01', '2026-10-08'),
    Option: [
      { Name: 'AccountingStandard', Value: 'GAAP' },
      { Name: 'NoReportData', Value: 'true' },
    ],
  },
  Columns: accountCols,
  Rows: {},
}

/** Balance sheet as of 2026-10-08. Bank accounts 62,345.67; A/R 18,900.00. */
export const balanceSheetFixture: QboReport = {
  Header: header('BalanceSheet', '2026-10-08', '2026-10-08'),
  Columns: accountCols,
  Rows: {
    Row: [
      {
        Header: { ColData: [{ value: 'ASSETS' }, { value: '' }] },
        Rows: {
          Row: [
            {
              Header: { ColData: [{ value: 'Current Assets' }, { value: '' }] },
              Rows: {
                Row: [
                  {
                    Header: { ColData: [{ value: 'Bank Accounts' }, { value: '' }] },
                    Rows: { Row: [data('Operating Checking', '50000.00', '35'), data('Payroll Checking', '12345.67', '36')] },
                    Summary: { ColData: [{ value: 'Total Bank Accounts' }, { value: '62345.67' }] },
                    type: 'Section',
                    group: 'BankAccounts',
                  },
                  {
                    Header: { ColData: [{ value: 'Accounts Receivable' }, { value: '' }] },
                    Rows: { Row: [data('Accounts Receivable (A/R)', '18900.00', '84')] },
                    Summary: { ColData: [{ value: 'Total Accounts Receivable' }, { value: '18900.00' }] },
                    type: 'Section',
                    group: 'AR',
                  },
                  {
                    Header: { ColData: [{ value: 'Other Current Assets' }, { value: '' }] },
                    Rows: { Row: [data('Prepaid Expenses', '2500.00', '40')] },
                    Summary: { ColData: [{ value: 'Total Other Current Assets' }, { value: '2500.00' }] },
                    type: 'Section',
                    group: 'OtherCurrentAssets',
                  },
                ],
              },
              Summary: { ColData: [{ value: 'Total Current Assets' }, { value: '83745.67' }] },
              type: 'Section',
              group: 'CurrentAssets',
            },
          ],
        },
        Summary: { ColData: [{ value: 'TOTAL ASSETS' }, { value: '83745.67' }] },
        type: 'Section',
        group: 'TotalAssets',
      },
      {
        Header: { ColData: [{ value: 'LIABILITIES AND EQUITY' }, { value: '' }] },
        Rows: {
          Row: [
            {
              Header: { ColData: [{ value: 'Liabilities' }, { value: '' }] },
              Rows: { Row: [data('Accounts Payable (A/P)', '7300.00', '33')] },
              Summary: { ColData: [{ value: 'Total Liabilities' }, { value: '7300.00' }] },
              type: 'Section',
              group: 'Liabilities',
            },
            {
              Header: { ColData: [{ value: 'Equity' }, { value: '' }] },
              Rows: { Row: [data('Retained Earnings', '76445.67', '2')] },
              Summary: { ColData: [{ value: 'Total Equity' }, { value: '76445.67' }] },
              type: 'Section',
              group: 'Equity',
            },
          ],
        },
        Summary: { ColData: [{ value: 'TOTAL LIABILITIES AND EQUITY' }, { value: '83745.67' }] },
        type: 'Section',
        group: 'TotalLiabilitiesAndEquity',
      },
    ],
  },
}

/** Same balance sheet with no bank-account section at all. */
export const balanceSheetWithoutBankFixture: QboReport = {
  ...balanceSheetFixture,
  Rows: {
    Row: [
      {
        Header: { ColData: [{ value: 'ASSETS' }, { value: '' }] },
        Rows: { Row: [data('Equipment', '5000.00', '50')] },
        Summary: { ColData: [{ value: 'TOTAL ASSETS' }, { value: '5000.00' }] },
        type: 'Section',
        group: 'TotalAssets',
      },
    ],
  },
}

/** AR aging summary as of 2026-10-08. Grand total 18,900.00 (Total column is last). */
export const agedReceivablesFixture: QboReport = {
  Header: {
    Time: '2026-10-08T02:00:00-04:00',
    ReportName: 'AgedReceivables',
    StartPeriod: '2026-10-08',
    EndPeriod: '2026-10-08',
    Currency: 'USD',
    Option: [
      { Name: 'report_date', Value: '2026-10-08' },
      { Name: 'NoReportData', Value: 'false' },
    ],
  },
  Columns: {
    Column: [
      { ColTitle: '', ColType: 'Customer', MetaData: [{ Name: 'ColKey', Value: 'customer' }] },
      { ColTitle: 'Current', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'current' }] },
      { ColTitle: '1 - 30', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: '0' }] },
      { ColTitle: '31 - 60', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: '1' }] },
      { ColTitle: '61 - 90', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: '2' }] },
      { ColTitle: '91 and over', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: '3' }] },
      { ColTitle: 'Total', ColType: 'Money', MetaData: [{ Name: 'ColKey', Value: 'total' }] },
    ],
  },
  Rows: {
    Row: [
      { ColData: [{ value: 'Example Client A', id: '1' }, { value: '9000.00' }, { value: '' }, { value: '' }, { value: '' }, { value: '' }, { value: '9000.00' }] },
      { ColData: [{ value: 'Example Client B', id: '2' }, { value: '4000.00' }, { value: '2400.00' }, { value: '' }, { value: '1500.00' }, { value: '2000.00' }, { value: '9900.00' }] },
      {
        Summary: {
          ColData: [{ value: 'TOTAL' }, { value: '13000.00' }, { value: '2400.00' }, { value: '0.00' }, { value: '1500.00' }, { value: '2000.00' }, { value: '18900.00' }],
        },
        type: 'Section',
        group: 'GrandTotal',
      },
    ],
  },
}

/** Variant with no column MetaData and no group name on the total line. */
export const agedReceivablesNoMetaFixture: QboReport = {
  Header: { ReportName: 'AgedReceivables', Option: [{ Name: 'NoReportData', Value: 'false' }] },
  Columns: {
    Column: [
      { ColTitle: '', ColType: 'Customer' },
      { ColTitle: 'Current', ColType: 'Money' },
      { ColTitle: 'Total', ColType: 'Money' },
    ],
  },
  Rows: {
    Row: [
      { ColData: [{ value: 'Example Client A', id: '1' }, { value: '334.11' }, { value: '334.11' }] },
      { Summary: { ColData: [{ value: 'TOTAL' }, { value: '334.11' }, { value: '334.11' }] }, type: 'Section' },
    ],
  },
}
