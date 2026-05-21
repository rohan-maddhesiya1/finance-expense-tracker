import React, { useState } from 'react';
import { Calculator, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Tax.css';

const OLD_SLABS = [
  { min:0, max:250000, rate:0 },
  { min:250000, max:500000, rate:5 },
  { min:500000, max:1000000, rate:20 },
  { min:1000000, max:Infinity, rate:30 },
];

const NEW_SLABS = [
  { min:0, max:300000, rate:0 },
  { min:300000, max:600000, rate:5 },
  { min:600000, max:900000, rate:10 },
  { min:900000, max:1200000, rate:15 },
  { min:1200000, max:1500000, rate:20 },
  { min:1500000, max:Infinity, rate:30 },
];

function calcTax(income, slabs) {
  let tax = 0;
  for (const slab of slabs) {
    if (income <= slab.min) break;
    const taxable = Math.min(income, slab.max) - slab.min;
    tax += taxable * slab.rate / 100;
  }
  return tax;
}

export default function Tax() {
  const { user } = useAuth();
  const sym = { USD:'$', EUR:'€', GBP:'£', INR:'₹', JPY:'¥', CAD:'CA$', AUD:'A$' }[user?.currency] || '$';

  const [grossIncome, setGrossIncome] = useState('');
  const [deductions80C, setDeductions80C] = useState('');
  const [deductions80D, setDeductions80D] = useState('');
  const [hra, setHra] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');
  const [regime, setRegime] = useState('new');

  const gross = Number(grossIncome) || 0;
  const d80c = Math.min(Number(deductions80C)||0, 150000);
  const d80d = Math.min(Number(deductions80D)||0, 25000);
  const hraAmt = Number(hra)||0;
  const other = Number(otherDeductions)||0;

  const stdDeduction = regime==='old' ? 50000 : 75000;
  const totalDeductions = regime==='old' ? d80c + d80d + hraAmt + other + stdDeduction : stdDeduction;
  const taxableIncome = Math.max(0, gross - totalDeductions);

  const slabs = regime==='new' ? NEW_SLABS : OLD_SLABS;
  let tax = calcTax(taxableIncome, slabs);

  // Rebate u/s 87A
  if (regime==='new' && taxableIncome <= 700000) tax = 0;
  if (regime==='old' && taxableIncome <= 500000) tax = 0;

  const cess = tax * 0.04;
  const totalTax = tax + cess;
  const effectiveRate = gross > 0 ? (totalTax/gross*100) : 0;
  const takeHome = gross - totalTax;

  const oldTax = calcTax(Math.max(0, gross-d80c-d80d-hraAmt-other-50000), OLD_SLABS);
  const newTax = calcTax(Math.max(0, gross-75000), NEW_SLABS);
  const oldEffective = gross>0?((oldTax*1.04)/gross*100):0;
  const newEffective = gross>0?((newTax*1.04)/gross*100):0;
  const savings = Math.abs((oldTax-newTax)*1.04);
  const betterRegime = newTax <= oldTax ? 'New Regime' : 'Old Regime';

  return (
    <div className="tax-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tax Calculator</h1>
          <p className="page-sub">Indian Income Tax 2024-25 (Old & New Regime)</p>
        </div>
      </div>

      <div className="tax-layout">
        <div className="tax-form card">
          <h3 className="tax-section-title">Income Details</h3>
          <div className="form-group">
            <label>Annual Gross Income ({sym})</label>
            <input type="number" value={grossIncome} onChange={e=>setGrossIncome(e.target.value)} placeholder="e.g. 1200000" />
          </div>

          <div className="tax-regime-toggle">
            <label>Tax Regime</label>
            <div className="toggle-group">
              <button className={regime==='new'?'active':''} onClick={()=>setRegime('new')}>New Regime</button>
              <button className={regime==='old'?'active':''} onClick={()=>setRegime('old')}>Old Regime</button>
            </div>
          </div>

          {regime==='old' && <>
            <h3 className="tax-section-title" style={{marginTop:'20px'}}>Deductions (Old Regime)</h3>
            <div className="form-group">
              <label>80C (ELSS, PPF, LIC) — max ₹1.5L</label>
              <input type="number" value={deductions80C} onChange={e=>setDeductions80C(e.target.value)} placeholder="0" max="150000" />
            </div>
            <div className="form-group">
              <label>80D (Health Insurance) — max ₹25K</label>
              <input type="number" value={deductions80D} onChange={e=>setDeductions80D(e.target.value)} placeholder="0" max="25000" />
            </div>
            <div className="form-group">
              <label>HRA Exemption</label>
              <input type="number" value={hra} onChange={e=>setHra(e.target.value)} placeholder="0" />
            </div>
            <div className="form-group">
              <label>Other Deductions</label>
              <input type="number" value={otherDeductions} onChange={e=>setOtherDeductions(e.target.value)} placeholder="0" />
            </div>
          </>}

          <div className="tax-info-box">
            <Info size={14}/> Standard Deduction of {regime==='new'?'₹75,000':'₹50,000'} auto-applied for {regime} regime
          </div>
        </div>

        <div className="tax-results">
          <div className="tax-result-card card">
            <h3 className="tax-section-title">Tax Summary</h3>
            <div className="tax-row"><span>Gross Income</span><span className="green">{sym}{gross.toLocaleString()}</span></div>
            <div className="tax-row"><span>Total Deductions</span><span className="red">-{sym}{totalDeductions.toLocaleString()}</span></div>
            <div className="tax-row bold"><span>Taxable Income</span><span>{sym}{taxableIncome.toLocaleString()}</span></div>
            <div className="tax-divider"/>
            <div className="tax-row"><span>Income Tax</span><span className="red">{sym}{tax.toLocaleString()}</span></div>
            <div className="tax-row"><span>Health & Education Cess (4%)</span><span className="red">{sym}{cess.toFixed(0)}</span></div>
            <div className="tax-row bold highlight"><span>Total Tax Payable</span><span className="red">{sym}{totalTax.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}</span></div>
            <div className="tax-divider"/>
            <div className="tax-row"><span>Effective Tax Rate</span><span>{effectiveRate.toFixed(2)}%</span></div>
            <div className="tax-row big"><span>In-Hand Income</span><span className="green">{sym}{takeHome.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}</span></div>
          </div>

          {gross > 0 && (
            <div className="regime-compare card">
              <h3 className="tax-section-title">Regime Comparison</h3>
              <div className="compare-grid">
                <div className={`compare-col ${betterRegime==='Old Regime'?'better':''}`}>
                  <div className="compare-label">Old Regime</div>
                  <div className="compare-tax red">{sym}{(oldTax*1.04).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}</div>
                  <div className="compare-rate">{oldEffective.toFixed(1)}% effective</div>
                </div>
                <div className="compare-vs">VS</div>
                <div className={`compare-col ${betterRegime==='New Regime'?'better':''}`}>
                  <div className="compare-label">New Regime</div>
                  <div className="compare-tax red">{sym}{(newTax*1.04).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}</div>
                  <div className="compare-rate">{newEffective.toFixed(1)}% effective</div>
                </div>
              </div>
              <div className="better-regime">
                <span style={{color:'var(--green)', fontWeight:700}}>{betterRegime}</span> saves you{' '}
                <strong style={{color:'var(--green)'}}>{sym}{savings.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g,',')}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
