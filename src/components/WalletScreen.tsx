import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  CheckCircle, 
  Shield, 
  Lock, 
  Briefcase, 
  QrCode, 
  Download, 
  Copy, 
  Check, 
  X, 
  Info, 
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { GeometricDivider } from './GeometricDivider';
import { QRCodeSVG } from 'qrcode.react';
import QRCodeScannerModal from './QRCodeScannerModal';
import EarningsPieChart from './EarningsPieChart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { logError, logWarn } from '../lib/logger';

const isValidDate = (d: any): d is Date => {
  return d instanceof Date && !isNaN(d.getTime());
};

const safeParseDate = (val: any): Date => {
  if (!val) return new Date();
  
  // If it's already a Date
  if (val instanceof Date) {
    return isValidDate(val) ? val : new Date();
  }

  // If it's a firestore timestamp (object with toDate() function)
  if (val && typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      if (isValidDate(d)) return d;
    } catch (e) {}
  }
  
  // If it's a firestore timestamp-like object with seconds and nanoseconds
  if (val && typeof val.seconds === 'number') {
    try {
      const d = new Date(val.seconds * 1000);
      if (isValidDate(d)) return d;
    } catch (e) {}
  }
  
  // Standard parsing
  try {
    const d = new Date(val);
    if (isValidDate(d)) return d;
  } catch (e) {}
  
  return new Date();
};

export default function WalletScreen() {
  const { 
    wallet, 
    withdrawals, 
    requestWithdrawal, 
    topUpWallet, 
    currentUser, 
    serviceRequests,
    p2pTransfers,
    transferFunds,
    triggerSound,
    showToast,
    services,
    updateRequestStatus
  } = useApp();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Active Escrow' | 'Released Funds'>('All');
  const { withdrawalFeePercentage } = useApp();

  const parsedAmount = Number(amount) || 0;
  const feeAmount = (parsedAmount * withdrawalFeePercentage) / 100;
  const payoutAmount = parsedAmount - feeAmount;

  // Haptic Feedback Trigger Helper
  const triggerVibration = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        logWarn("Haptic feedback not supported in this browser context", e);
      }
    }
  };

  // Escrow Education & Control States
  const [showHowEscrowWorks, setShowHowEscrowWorks] = useState(false);
  const [escrowStep, setEscrowStep] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // QR-code specific states
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false);
  
  const [reqAmount, setReqAmount] = useState('');
  const [reqRef, setReqRef] = useState('');
  const [copied, setCopied] = useState(false);
  const [requestType, setRequestType] = useState<'standard' | 'escrow'>('standard');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  const [scannedPayment, setScannedPayment] = useState<{
    recipientId: string;
    recipientName: string;
    amount: number;
    reference: string;
    isEscrow?: boolean;
    requestId?: string;
  } | null>(null);
  
  const [payAmount, setPayAmount] = useState('');
  const [payRef, setPayRef] = useState('');
  const [isExecutingTransfer, setIsExecutingTransfer] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const qrRef = useRef<SVGSVGElement>(null);

  const handleWithdraw = () => {
    if (amount && Number(amount) > 0) {
      const success = requestWithdrawal(Number(amount), 'Standard Bank', '123456789');
      if (success) {
        setShowWithdrawModal(false);
        setAmount('');
      }
    }
  };

  const handleDownloadReceipt = (tx: any) => {
    const referenceNo = `REF-ESC-${tx.id.split('-')[0].substring(0, 8).toUpperCase()}`;
    const parsedDate = safeParseDate(tx.rawDate);
    const timestamp = parsedDate.toISOString().replace('T', ' ').substring(0, 19);
    
    const receiptContent = `
=========================================
          DOER.za OFFICIAL RECEIPT       
=========================================
Transaction ID:   ${tx.id}
Reference No:     ${referenceNo}
Date & Time:      ${timestamp}
=========================================
Transaction Type: ${tx.type.toUpperCase()}
Title:            ${tx.title}
Description:      ${tx.description}
=========================================
Amount Paid:      R ${tx.amount}
Payment Status:   COMPLETED / SECURED
Escrow Protection: Active (DOER Dual-Release)
=========================================
Thank you for using DOER.za!
Secured by DOER Escrow Services.
=========================================
`;

    const element = document.createElement("a");
    const file = new Blob([receiptContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `DOER_Receipt_${referenceNo}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showToast('Receipt downloaded successfully! 📄', 'success');
    triggerSound('success');
  };

  // QR code action handlers
  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    try {
      const svgData = new XMLSerializer().serializeToString(qrRef.current);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `doer_payment_qr_${currentUser?.firstName || 'user'}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
        showToast('QR Code saved to gallery! 📸', 'success');
      };
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
    } catch (e) {
      logError(e);
      showToast('Failed to save QR code', 'error');
    }
  };

  const handleCopyLink = () => {
    const paymentUrl = `${window.location.origin}/pay-wallet?to=${currentUser?.id}&name=${encodeURIComponent(`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim())}${reqAmount ? `&amount=${reqAmount}` : ''}${reqRef ? `&ref=${encodeURIComponent(reqRef)}` : ''}${requestType === 'escrow' && selectedJobId ? `&type=escrow&requestId=${selectedJobId}` : ''}`;
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    triggerSound('success');
    showToast('Payment link copied to clipboard! 📋', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScanSuccess = (scannedValue: string) => {
    try {
      let recipientId = '';
      let recipientName = '';
      let amount = 0;
      let reference = '';
      let isEscrow = false;
      let requestId = '';

      if (scannedValue.startsWith('{')) {
        const data = JSON.parse(scannedValue);
        if (data.type === 'p2p_payment') {
          recipientId = data.recipientId;
          recipientName = data.recipientName;
          amount = Number(data.amount) || 0;
          reference = data.reference || '';
        } else if (data.type === 'escrow') {
          recipientId = data.recipientId;
          recipientName = data.recipientName;
          amount = Number(data.amount) || 0;
          reference = data.reference || '';
          isEscrow = true;
          requestId = data.requestId || '';
        }
      } else {
        // Parse URL params
        const urlObj = new URL(scannedValue);
        recipientId = urlObj.searchParams.get('to') || '';
        recipientName = urlObj.searchParams.get('name') || '';
        amount = Number(urlObj.searchParams.get('amount')) || 0;
        reference = urlObj.searchParams.get('ref') || '';
        isEscrow = urlObj.searchParams.get('type') === 'escrow';
        requestId = urlObj.searchParams.get('requestId') || '';
      }

      if (!recipientId) {
        showToast('Invalid payment QR code!', 'error');
        return;
      }

      if (recipientId === currentUser?.id) {
        showToast('You cannot pay yourself!', 'error');
        return;
      }

      setScannedPayment({
        recipientId,
        recipientName: recipientName || 'DOER Professional',
        amount,
        reference: reference || '',
        isEscrow,
        requestId
      });
      setPayAmount(amount > 0 ? String(amount) : '');
      setPayRef(reference || '');
      setShowConfirmPaymentModal(true);
    } catch (e) {
      logError(e);
      showToast('Error parsing QR code!', 'error');
    }
  };

  const handleExecutePayment = async () => {
    if (!scannedPayment) return;
    const finalAmount = Number(payAmount);
    const finalRef = payRef.trim() || 'QR Instant Payment';

    if (!finalAmount || finalAmount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    if (wallet.balance < finalAmount) {
      showToast('Insufficient wallet balance!', 'error');
      return;
    }

    setIsExecutingTransfer(true);
    try {
      if (scannedPayment.isEscrow && scannedPayment.requestId) {
        // Pay the escrow deposit
        await updateRequestStatus(scannedPayment.requestId, 'deposit_paid');
        triggerVibration([100, 50, 100]); // Dual haptic pulse
        setShowConfirmPaymentModal(false);
        setScannedPayment(null);
        setPayAmount('');
        setPayRef('');
      } else {
        const success = await transferFunds(
          scannedPayment.recipientId,
          scannedPayment.recipientName,
          finalAmount,
          finalRef
        );
        if (success) {
          triggerVibration(100); // Standard pulse
          setShowConfirmPaymentModal(false);
          setScannedPayment(null);
          setPayAmount('');
          setPayRef('');
        }
      }
    } catch (e) {
      logError(e);
    } finally {
      setIsExecutingTransfer(false);
    }
  };

  const getEarningsBreakdown = () => {
    const categoryEarnings: { [category: string]: number } = {};

    (serviceRequests || []).forEach((req) => {
      const isDoer = req.doerId === currentUser?.id;
      if (isDoer && req.status === 'released') {
        let categoryName = req.isProductOrder ? 'Physical Products' : 'General Service';
        
        if (req.serviceId) {
          const service = (services || []).find((s) => s.id === req.serviceId);
          if (service) {
            categoryName = service.categoryName || service.category || categoryName;
          }
        }
        categoryEarnings[categoryName] = (categoryEarnings[categoryName] || 0) + req.price;
      }
    });

    (p2pTransfers || []).forEach((tx) => {
      const isRecipient = tx.recipientId === currentUser?.id;
      if (isRecipient) {
        const categoryName = 'Direct Scan Payments';
        categoryEarnings[categoryName] = (categoryEarnings[categoryName] || 0) + tx.amount;
      }
    });

    const breakdown = Object.entries(categoryEarnings).map(([category, amount]) => ({
      category,
      amount
    }));

    return breakdown.sort((a, b) => b.amount - a.amount);
  };

  const earningsData = getEarningsBreakdown();

  const getTransactions = () => {
    const list: {
      id: string;
      type: 'Earned' | 'Spent' | 'Escrowed';
      title: string;
      description: string;
      amount: number;
      timestamp: string;
      rawDate: Date;
      status?: string;
      requestStatus?: string;
    }[] = [];

    // 1. Process Withdrawals
    withdrawals.forEach((w) => {
      list.push({
        id: w.id,
        type: 'Spent',
        title: 'Bank Withdrawal',
        description: `${w.bankName} • Acc: ${w.accountNumber.slice(-4).padStart(8, '*')}`,
        amount: w.amount,
        timestamp: w.createdAt,
        rawDate: safeParseDate(w.createdAt),
        status: w.status,
      });
    });

    // 2. Process Service Requests
    serviceRequests.forEach((req) => {
      const isClient = req.bookingOwnerId === currentUser?.id;
      const isDoer = req.doerId === currentUser?.id;

      if (isClient) {
        // Client perspective
        if (['deposit_paid', 'in_progress', 'awaiting_approval'].includes(req.status)) {
          list.push({
            id: `${req.id}-deposit-held`,
            type: 'Escrowed',
            title: 'Escrow Deposit Held',
            description: `Secured for "${req.title}" by ${req.doerName}`,
            amount: req.depositAmount,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: 'held',
            requestStatus: req.status,
          });
        } else if (req.status === 'completed') {
          list.push({
            id: `${req.id}-full-held`,
            type: 'Escrowed',
            title: 'Full Escrow Held',
            description: `Completed job: pending release for "${req.title}"`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: 'held',
            requestStatus: req.status,
          });
        } else if (req.status === 'released') {
          list.push({
            id: `${req.id}-spent`,
            type: 'Spent',
            title: 'Service Payment',
            description: `Released to ${req.doerName} for "${req.title}"`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: 'completed',
            requestStatus: req.status,
          });
        }
      }

      if (isDoer) {
        // Doer perspective
        if (['deposit_paid', 'in_progress', 'awaiting_approval'].includes(req.status)) {
          list.push({
            id: `${req.id}-deposit-escrow`,
            type: 'Escrowed',
            title: 'Secure Escrow Locked',
            description: `50% deposit held for "${req.title}" from ${req.bookingOwnerName}`,
            amount: req.depositAmount,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: 'held',
            requestStatus: req.status,
          });
        } else if (req.status === 'completed') {
          list.push({
            id: `${req.id}-full-escrow`,
            type: 'Escrowed',
            title: 'Awaiting Release Hold',
            description: `Completed work on "${req.title}" for ${req.bookingOwnerName}`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: 'held',
            requestStatus: req.status,
          });
        } else if (req.status === 'released') {
          list.push({
            id: `${req.id}-earned`,
            type: 'Earned',
            title: 'Job Income Received',
            description: `Earned from ${req.bookingOwnerName} for "${req.title}"`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: 'completed',
            requestStatus: req.status,
          });
        }
      }
    });

    // 3. Process P2P Transfers
    (p2pTransfers || []).forEach((tx) => {
      const isSender = tx.senderId === currentUser?.id;
      list.push({
        id: tx.id,
        type: isSender ? 'Spent' : 'Earned',
        title: isSender ? `Paid ${tx.recipientName}` : `Received from ${tx.senderName}`,
        description: `Instant Scan Pay • Ref: ${tx.reference}`,
        amount: tx.amount,
        timestamp: tx.createdAt,
        rawDate: safeParseDate(tx.createdAt),
        status: 'completed'
      });
    });

    const sorted = list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    if (filterType === 'All') return sorted;
    if (filterType === 'Active Escrow') return sorted.filter((t) => t.type === 'Escrowed');
    if (filterType === 'Released Funds') return sorted.filter((t) => t.type === 'Earned');
    return sorted;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      <div className="bg-zinc-900 px-6 pt-12 pb-8 rounded-b-3xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand rounded-full blur-3xl mix-blend-screen"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/90 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
            <Wallet className="w-3.5 h-3.5" />
            DOER Wallet
          </span>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">
            R {wallet.balance}
          </h1>
          <p className="text-sm font-medium text-white/60">Available Balance</p>
          
          <div className="flex gap-3 mt-6">
            <button 
              onClick={() => topUpWallet(1000)}
              className="flex-1 bg-brand text-zinc-900 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-brand-hover transition-colors shadow-lg shadow-brand/20">
              <ArrowDownLeft className="w-4 h-4" />
              Top Up
            </button>
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="flex-1 bg-white/10 text-white border border-white/20 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-white/20 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button 
              onClick={() => {
                triggerSound('click');
                setShowScannerModal(true);
              }}
              className="bg-emerald-500 text-zinc-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10">
              <QrCode className="w-4 h-4" />
              Scan & Pay
            </button>
            <button 
              onClick={() => {
                triggerSound('click');
                setShowReceiveModal(true);
              }}
              className="bg-zinc-800 text-white border border-zinc-750 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-zinc-700 transition-colors">
              <QrCode className="w-4 h-4 text-emerald-400" />
              Receive Code
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6">
        {/* Escrow Education Banner */}
        <div className="bg-linear-to-r from-zinc-950 to-zinc-850 p-5 rounded-[28px] text-white flex items-center justify-between shadow-md relative overflow-hidden text-left border border-zinc-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <h4 className="text-xs font-black uppercase tracking-wider text-brand">Secure Escrow Protection</h4>
            <p className="text-[11px] text-white/70 leading-normal max-w-[240px]">
              Learn how DOER secures payments and protects both clients and service partners.
            </p>
            <button
              onClick={() => {
                triggerSound('click');
                setShowHowEscrowWorks(true);
                setEscrowStep(0);
              }}
              className="mt-2.5 px-3 py-1.5 bg-brand hover:bg-brand-hover text-zinc-950 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
              id="learn-escrow-trigger"
            >
              <Info className="w-3.5 h-3.5" />
              How Escrow Works
            </button>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
            <Shield className="w-5.5 h-5.5 text-brand" />
          </div>
        </div>

        {/* Earnings Category Breakdown (D3 Pie Chart) */}
        {earningsData.length > 0 ? (
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <GeometricDivider variant="accent" />
              Earnings Breakdown
            </h3>
            <EarningsPieChart data={earningsData} />
          </div>
        ) : (
          <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
              <GeometricDivider variant="accent" />
              Earnings Breakdown
            </h3>
            <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2.5">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-black text-slate-800">No Earnings Recorded Yet</span>
              <p className="text-[10px] text-slate-400 font-bold leading-normal mt-1 max-w-[220px]">
                Complete jobs, deliver service requests or receive scan payments to see your visual pie breakdown.
              </p>
            </div>
          </div>
        )}

        <motion.div
          className="bg-white p-5 geom-card border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-lg transition-all duration-300"
          whileHover={{
            scale: 1.02
          }}>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Escrow Held</span>
            <span className="text-lg font-black text-slate-800">R {wallet.escrowBalance}</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-slate-400" />
          </div>
        </motion.div>

        {/* Escrow Summary Donut Chart Card */}
        {(() => {
          const activeEscrowRequests = serviceRequests.filter(r => 
            (r.bookingOwnerId === currentUser?.id || r.doerId === currentUser?.id)
          );
          const heldInEscrow = activeEscrowRequests
            .filter(r => ['deposit_paid', 'in_progress', 'awaiting_approval'].includes(r.status))
            .reduce((sum, r) => sum + r.depositAmount, 0) +
            activeEscrowRequests
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + r.price, 0);

          const releasedPayments = activeEscrowRequests
            .filter(r => r.status === 'released')
            .reduce((sum, r) => sum + r.price, 0);

          const totalEscrowVolume = heldInEscrow + releasedPayments;

          const heldPct = totalEscrowVolume > 0 ? (heldInEscrow / totalEscrowVolume) * 100 : 0;
          const releasedPct = totalEscrowVolume > 0 ? (releasedPayments / totalEscrowVolume) * 100 : 0;

          const escrowChartData = totalEscrowVolume === 0
            ? [{ name: 'No Data', value: 1, color: '#e2e8f0' }]
            : [
                { name: 'Held in Escrow', value: heldInEscrow, color: '#8b5cf6' },
                { name: 'Released Payments', value: releasedPayments, color: '#10b981' }
              ].filter(d => d.value > 0);

          return (
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <GeometricDivider variant="accent" />
                Escrow Portfolio Summary
              </h3>

              <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50/50 p-4.5 rounded-[24px] border border-slate-100/60 shadow-inner">
                {/* Circular Donut Visual */}
                <div className="relative w-[110px] h-[110px] flex items-center justify-center shrink-0 bg-white rounded-full border border-slate-100 shadow-xs select-none">
                  <div className="w-[100px] h-[100px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={escrowChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={40}
                          paddingAngle={totalEscrowVolume === 0 ? 0 : 2}
                          dataKey="value"
                        >
                          {escrowChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Center Summary Figure */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                      <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none mb-0.5">Total Vol</span>
                      <span className="text-xs font-black text-slate-800 leading-none">R {totalEscrowVolume}</span>
                    </div>
                  </div>
                </div>

                {/* Ledger Legend Details */}
                <div className="space-y-2.5 flex-1 w-full text-left">
                  <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Escrow Asset Allocations</h4>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                        <span className="text-slate-600 font-bold">Held in Escrow</span>
                      </div>
                      <div className="font-mono font-black text-slate-800 flex items-center gap-1.5">
                        <span>R {heldInEscrow}</span>
                        <span className="text-[8px] bg-violet-50 text-violet-600 px-1.5 py-0.5 rounded font-bold">
                          {Math.round(heldPct)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-slate-600 font-bold">Released Payments</span>
                      </div>
                      <div className="font-mono font-black text-slate-800 flex items-center gap-1.5">
                        <span>R {releasedPayments}</span>
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">
                          {Math.round(releasedPct)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 font-bold leading-normal border-t border-slate-100 pt-1.5">
                    🔒 Held in Escrow funds represent active security deposits waiting for delivery sign-offs.
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Active Escrow Protection Ledger */}
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
            <GeometricDivider variant="accent" />
            Active Escrow Protection
          </h3>
          
          {(() => {
            const activeEscrowContracts = serviceRequests.filter((r) => 
              (r.bookingOwnerId === currentUser?.id || r.doerId === currentUser?.id) &&
              ['accepted', 'deposit_paid', 'in_progress', 'awaiting_approval', 'completed'].includes(r.status)
            );

            if (activeEscrowContracts.length === 0) {
              return (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400 font-semibold text-xs space-y-1 shadow-2xs">
                  <Lock className="w-5 h-5 text-slate-300 mx-auto mb-1 opacity-70" />
                  <span>No Active Escrow Holds</span>
                  <p className="text-[9px] text-slate-400 font-bold leading-normal">
                    Escrow is automatically initialized when service agreements start.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {activeEscrowContracts.map(req => {
                  const isClient = req.bookingOwnerId === currentUser?.id;
                  let escrowStatusLabel = '';
                  let escrowAmountHeld = 0;
                  let statusColor = '';

                  if (req.status === 'accepted') {
                    escrowStatusLabel = "Agreement Signed • Deposit Awaiting";
                    escrowAmountHeld = 0;
                    statusColor = "text-amber-600 bg-amber-50/60 border-amber-200/50";
                  } else if (['deposit_paid', 'in_progress', 'awaiting_approval'].includes(req.status)) {
                    escrowStatusLabel = "Escrow Secured • 50% Deposit Locked";
                    escrowAmountHeld = req.depositAmount;
                    statusColor = "text-violet-700 bg-violet-50/60 border-violet-200/50";
                  } else if (req.status === 'completed') {
                    escrowStatusLabel = "Job Completed • Full Funds Awaiting Release";
                    escrowAmountHeld = req.price;
                    statusColor = "text-emerald-700 bg-emerald-50/60 border-emerald-200/50";
                  }

                  return (
                    <div key={req.id} className="bg-white p-4.5 rounded-2xl border border-slate-100 shadow-2xs text-left space-y-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${statusColor}`}>
                            {req.status.replace('_', ' ')}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 mt-1.5 leading-tight truncate">{req.title}</h4>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                            {isClient ? `DOER Partner: ${req.doerName}` : `Client Buyer: ${req.bookingOwnerName}`}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-slate-900 block">R {escrowAmountHeld}</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Locked</span>
                        </div>
                      </div>

                      <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100/60 text-[9px] text-slate-500 font-bold space-y-1">
                        <div className="flex justify-between">
                          <span>Escrow Phase:</span>
                          <span className="text-slate-700">{escrowStatusLabel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Agreement Price:</span>
                          <span className="text-slate-700 font-black">R {req.price}</span>
                        </div>
                        {req.status !== 'completed' && (
                          <div className="flex justify-between">
                            <span>Escrow Hold Policy:</span>
                            <span className="text-emerald-600">50% Escrow Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <GeometricDivider variant="accent" />
              Transaction History
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  triggerSound('click');
                  setIsRefreshing(true);
                  triggerVibration(100);
                  setTimeout(() => {
                    setIsRefreshing(false);
                    triggerSound('success');
                    showToast('Escrow status and transaction logs successfully updated! 🔄', 'success');
                  }, 1000);
                }}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 active:scale-95 text-slate-600 border border-slate-150 rounded-xl font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                id="refresh-escrow-button"
              >
                <RefreshCw className={`w-3 h-3 text-slate-500 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
                Refresh Status
              </button>

              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider">
                {getTransactions().length} record{getTransactions().length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 select-none scrollbar-none">
            {(['All', 'Active Escrow', 'Released Funds'] as const).map((type) => {
              const isActive = filterType === type;
              return (
                <button
                  key={type}
                  onClick={() => {
                    triggerSound('click');
                    setFilterType(type);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[10px] font-black transition-all border shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                      : 'bg-white text-slate-500 hover:text-slate-800 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  {type === 'Released Funds' ? '💰 ' : type === 'Active Escrow' ? '🔒 ' : '📂 '}
                  {type === 'All' ? 'All Transactions' : type}
                </button>
              );
            })}
          </div>

          {(() => {
            const txs = getTransactions();
            if (txs.length === 0) {
              return (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center text-slate-400 font-semibold text-xs py-10 shadow-2xs">
                  No transactions found for "{filterType}"
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {txs.map((tx) => {
                  let iconEl = null;
                  let iconBg = '';
                  let amountColor = '';
                  let amountPrefix = '';

                  if (tx.type === 'Earned') {
                    iconEl = <ArrowDownLeft className="w-4 h-4 text-emerald-600" />;
                    iconBg = 'bg-emerald-50 border border-emerald-100';
                    amountColor = 'text-emerald-600';
                    amountPrefix = '+ ';
                  } else if (tx.type === 'Spent') {
                    iconEl = <ArrowUpRight className="w-4 h-4 text-rose-600" />;
                    iconBg = 'bg-rose-50 border border-rose-100';
                    amountColor = 'text-rose-600';
                    amountPrefix = '- ';
                  } else {
                    iconEl = <Lock className="w-4 h-4 text-violet-600" />;
                    iconBg = 'bg-violet-50 border border-violet-100';
                    amountColor = 'text-violet-600';
                    amountPrefix = '';
                  }

                  // Format timestamp beautifully
                  let dateStr = 'Recently';
                  try {
                    dateStr = tx.rawDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' • ' + tx.rawDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } catch (e) {}

                  return (
                    <div 
                      key={tx.id} 
                      onClick={() => {
                        triggerSound('click');
                        setSelectedTx(tx);
                      }}
                      className="bg-white p-3.5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-3xs hover:border-slate-200/80 hover:bg-slate-50/35 cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                          {iconEl}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-black text-slate-800 block truncate">{tx.title}</span>
                          <span className="text-[10px] text-slate-500 font-semibold block truncate leading-tight mt-0.5">{tx.description}</span>
                          
                          {tx.requestStatus && (
                            <div className="mt-1 flex items-center gap-1.5">
                              {['deposit_paid', 'in_progress', 'awaiting_approval', 'completed'].includes(tx.requestStatus) ? (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100/50 px-1.5 py-0.5 rounded-full">
                                  <Shield className="w-2 h-2" /> Escrow Secured
                                </span>
                              ) : tx.requestStatus === 'released' ? (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-1.5 py-0.5 rounded-full">
                                  <CheckCircle className="w-2 h-2" /> Payment Received by Doer
                                </span>
                              ) : null}
                            </div>
                          )}
                          
                          <span className="text-[8px] text-slate-400 font-bold block mt-1 uppercase tracking-wider">{dateStr}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className={`text-xs font-black block ${amountColor}`}>
                          {amountPrefix}R {tx.amount}
                        </span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider border ml-auto inline-block mt-1 ${
                          tx.type === 'Earned' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : tx.type === 'Spent'
                            ? 'bg-rose-50 text-rose-700 border-rose-100'
                            : 'bg-violet-50 text-violet-700 border-violet-100'
                        }`}>
                          {tx.type}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>
      {showWithdrawModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl"
          >
            <h2 className="text-xl font-black text-slate-900 mb-1">Withdraw Funds</h2>
            <p className="text-xs text-slate-500 font-medium mb-6">Enter amount to withdraw to your linked bank account.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1.5 block">Amount (ZAR)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">R</span>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-black text-slate-800 focus:outline-none focus:border-brand focus:bg-white transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {parsedAmount > 0 && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>Service Fee ({withdrawalFeePercentage}%)</span>
                        <span>R {feeAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 border-t pt-2 mt-2">
                        <span>Final Payout</span>
                        <span>R {payoutAmount.toFixed(2)}</span>
                    </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-3.5 rounded-2xl font-black text-xs text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wide">
                Cancel
              </button>
              <button 
                onClick={handleWithdraw}
                className="flex-1 bg-brand text-zinc-900 py-3.5 rounded-2xl font-black text-xs hover:bg-brand-hover transition-colors uppercase tracking-wide">
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* QR Scanner Modal for Wallet QR Scans */}
      <QRCodeScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onRawScanSuccess={handleScanSuccess}
      />
      {/* QR Generation Receive Modal */}
      {showReceiveModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative"
          >
            <button 
              onClick={() => {
                setShowReceiveModal(false);
                setReqAmount('');
                setReqRef('');
                setRequestType('standard');
                setSelectedJobId('');
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mt-2">
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-colors ${requestType === 'escrow' ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {requestType === 'escrow' ? <Shield className="w-6 h-6 animate-pulse" /> : <QrCode className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {requestType === 'escrow' ? 'Escrow secure request' : 'My Payment Code'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {requestType === 'escrow' ? 'Show clients this secure QR code to lock deposit funds' : 'Let clients scan this to pay you instantly'}
              </p>
            </div>

            {/* Request Type Selector */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 mb-4 mt-4">
              <button
                type="button"
                onClick={() => {
                  setRequestType('standard');
                  setSelectedJobId('');
                  setReqAmount('');
                  setReqRef('');
                }}
                className={`flex-1 py-2 text-center rounded-xl font-bold text-[11px] transition-all ${requestType === 'standard' ? 'bg-white text-slate-900 shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Standard P2P
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequestType('escrow');
                  const activeDoerJobs = (serviceRequests || []).filter(
                    (req) => req.doerId === currentUser?.id && ['requested', 'accepted'].includes(req.status)
                  );
                  if (activeDoerJobs.length > 0) {
                    const firstJob = activeDoerJobs[0];
                    setSelectedJobId(firstJob.id);
                    setReqAmount(String(firstJob.depositAmount || Math.round(firstJob.price * 0.5)));
                    setReqRef(firstJob.title);
                  }
                }}
                className={`flex-1 py-2 text-center rounded-xl font-bold text-[11px] transition-all flex items-center justify-center gap-1 ${requestType === 'escrow' ? 'bg-violet-600 text-white shadow-3xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Shield className="w-3 h-3" /> Secure Escrow
              </button>
            </div>

            <div className="my-5 bg-slate-50 p-4 rounded-[24px] flex flex-col items-center justify-center border border-slate-100">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3">
                <QRCodeSVG 
                  value={`${window.location.origin}/pay-wallet?to=${currentUser?.id}&name=${encodeURIComponent(`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim())}${reqAmount ? `&amount=${reqAmount}` : ''}${reqRef ? `&ref=${encodeURIComponent(reqRef)}` : ''}${requestType === 'escrow' && selectedJobId ? `&type=escrow&requestId=${selectedJobId}` : ''}`}
                  size={140}
                  level="H"
                  ref={qrRef}
                />
              </div>

              <span className="text-xs font-black text-slate-800">
                {currentUser?.firstName} {currentUser?.lastName}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${requestType === 'escrow' ? 'text-violet-600' : 'text-emerald-600'}`}>
                {requestType === 'escrow' ? 'DOER Secure Escrow Payment' : 'Verified DOER Wallet'}
              </span>

              {reqAmount && (
                <div className={`mt-2.5 px-3 py-1 rounded-full font-black text-xs ${requestType === 'escrow' ? 'bg-violet-100 text-violet-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {requestType === 'escrow' ? 'Secure Deposit: ' : 'Requesting: '} R {reqAmount}
                </div>
              )}
            </div>

            {/* Configurable details */}
            <div className="space-y-3 mb-6">
              {requestType === 'escrow' && (
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Select Active Job</label>
                  {(() => {
                    const activeDoerJobs = (serviceRequests || []).filter(
                      (req) => req.doerId === currentUser?.id && ['requested', 'accepted'].includes(req.status)
                    );
                    if (activeDoerJobs.length === 0) {
                      return (
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-center">
                          <p className="text-[10px] text-amber-700 font-bold">No active pending-deposit jobs found where you are the DOER.</p>
                        </div>
                      );
                    }
                    return (
                      <select
                        value={selectedJobId}
                        onChange={(e) => {
                          const jobId = e.target.value;
                          setSelectedJobId(jobId);
                          const job = activeDoerJobs.find((j) => j.id === jobId);
                          if (job) {
                            setReqAmount(String(job.depositAmount || Math.round(job.price * 0.5)));
                            setReqRef(job.title);
                          }
                        }}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-500 transition-all"
                      >
                        {activeDoerJobs.map((job) => (
                          <option key={job.id} value={job.id}>
                            {job.title} (R {job.price})
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              )}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                  {requestType === 'escrow' ? 'Secure Deposit Amount (R)' : 'Requested Amount (Optional)'}
                </label>
                <input 
                  type="number"
                  value={reqAmount}
                  onChange={(e) => setReqAmount(e.target.value)}
                  disabled={requestType === 'escrow'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-75 disabled:bg-slate-100"
                  placeholder="0.00"
                />
                {requestType === 'escrow' && (
                  <p className="text-[9px] text-slate-400 font-bold mt-1">Escrow deposit is 50% of the total price (secured automatically).</p>
                )}
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Payment Reference</label>
                <input 
                  type="text"
                  value={reqRef}
                  onChange={(e) => setReqRef(e.target.value)}
                  disabled={requestType === 'escrow'}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 transition-all disabled:opacity-75 disabled:bg-slate-100"
                  placeholder="e.g. Plumbing Service"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button 
                onClick={handleCopyLink}
                className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                Copy Link
              </button>
              <button 
                onClick={handleDownloadQR}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10"
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Confirm Payment Modal */}
      {showConfirmPaymentModal && scannedPayment && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative"
          >
            <button 
              onClick={() => {
                setShowConfirmPaymentModal(false);
                setScannedPayment(null);
              }}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mt-2">
              <div className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${scannedPayment.isEscrow ? 'bg-violet-50 text-violet-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {scannedPayment.isEscrow ? <Shield className="w-6 h-6 animate-pulse" /> : <ArrowUpRight className="w-6 h-6" />}
              </div>
              <h2 className="text-xl font-black text-slate-900 leading-tight">
                {scannedPayment.isEscrow ? 'Secure Escrow Deposit' : 'Confirm Payment'}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {scannedPayment.isEscrow ? 'Locking 50% deposit in secure escrow' : 'Review transaction details below'}
              </p>
            </div>

            <div className="my-5 p-4 bg-slate-50 rounded-[20px] border border-slate-100 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${scannedPayment.isEscrow ? 'bg-violet-100 text-violet-700' : 'bg-zinc-200 text-slate-600'}`}>
                  {scannedPayment.isEscrow ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block leading-none mb-0.5">
                    {scannedPayment.isEscrow ? 'SECURE TO DOER' : 'PAYING TO'}
                  </span>
                  <span className="text-xs font-black text-slate-800 block">{scannedPayment.recipientName}</span>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Amount input/display */}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">
                  {scannedPayment.isEscrow ? 'Escrow Deposit (50%)' : 'Amount (ZAR)'}
                </label>
                {scannedPayment.amount > 0 ? (
                  <div className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-black flex items-center justify-between ${scannedPayment.isEscrow ? 'bg-violet-50 border border-violet-100 text-violet-800' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
                    <span>R {scannedPayment.amount}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${scannedPayment.isEscrow ? 'bg-violet-200 text-violet-800' : 'bg-slate-200 text-slate-500'}`}>
                      {scannedPayment.isEscrow ? 'Escrow Protected' : 'QR Locked'}
                    </span>
                  </div>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">R</span>
                    <input 
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-sm text-slate-800 focus:outline-none focus:border-brand transition-all"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>

              {/* Reference input */}
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1 block">Reference / Note</label>
                <input 
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:outline-none focus:border-brand transition-all font-sans"
                  placeholder="e.g. Deposit for Painting"
                  disabled={!!scannedPayment.reference}
                />
              </div>

              <div className="h-px bg-slate-100"></div>

              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Available Balance</span>
                <span className={wallet.balance < (Number(payAmount) || scannedPayment.amount) ? 'text-rose-600' : 'text-slate-800'}>
                  R {wallet.balance}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowConfirmPaymentModal(false);
                  setScannedPayment(null);
                }}
                className="flex-1 py-3.5 rounded-2xl font-black text-xs text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wide font-sans"
                disabled={isExecutingTransfer}
              >
                Cancel
              </button>
              <button 
                onClick={handleExecutePayment}
                disabled={isExecutingTransfer || wallet.balance < (Number(payAmount) || scannedPayment.amount)}
                className={`flex-1 disabled:bg-slate-100 disabled:text-slate-400 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all ${scannedPayment.isEscrow ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/10' : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/10'}`}
              >
                {isExecutingTransfer ? (
                  <span className={`w-4 h-4 border-2 border-t-transparent rounded-full animate-spin ${scannedPayment.isEscrow ? 'border-white' : 'border-zinc-950'}`}></span>
                ) : (
                  <>
                    {scannedPayment.isEscrow ? <Shield className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    {scannedPayment.isEscrow ? 'Secure Escrow' : 'Confirm & Pay'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl relative text-left"
          >
            <button 
              onClick={() => setSelectedTx(null)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mt-2">
              <div className="mx-auto w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">Transaction Details</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">DOER Secure Escrow Payment</p>
            </div>

            <div className="my-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Reference No</span>
                <span className="font-black text-slate-800 font-mono text-[10px]">
                  REF-ESC-{selectedTx.id.split('-')[0].substring(0, 8).toUpperCase()}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Exact Timestamp</span>
                <span className="font-bold text-slate-700 text-[10px]">
                  {safeParseDate(selectedTx.rawDate).toISOString().replace('T', ' ').substring(0, 19)}
                </span>
              </div>

              <div className="flex justify-between items-start pb-2 border-b border-slate-200/60 gap-3">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider shrink-0">Title</span>
                <span className="font-black text-slate-800 text-right leading-tight">
                  {selectedTx.title}
                </span>
              </div>

              <div className="flex justify-between items-start pb-2 border-b border-slate-200/60 gap-3">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider shrink-0">Description</span>
                <span className="font-semibold text-slate-600 text-right leading-tight text-[10.5px]">
                  {selectedTx.description}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Amount</span>
                <span className="font-black text-slate-900 text-sm">
                  R {selectedTx.amount}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Escrow Status</span>
                <div>
                  {selectedTx.requestStatus ? (
                    ['deposit_paid', 'in_progress', 'awaiting_approval', 'completed'].includes(selectedTx.requestStatus) ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200 px-2.5 py-0.5 rounded-full animate-pulse">
                        <Shield className="w-2.5 h-2.5" /> Escrow Secured
                      </span>
                    ) : selectedTx.requestStatus === 'released' ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" /> Payment Released
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 rounded-full">
                        {selectedTx.requestStatus.toUpperCase()}
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle className="w-2.5 h-2.5" /> Settled / Completed
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs text-center transition-colors uppercase tracking-wide"
              >
                Close
              </button>
              <button 
                onClick={() => handleDownloadReceipt(selectedTx)}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-600/15 uppercase tracking-wide"
              >
                <Download className="w-4 h-4" />
                Receipt
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* How Escrow Works Modal Overlay */}
      <AnimatePresence>
        {showHowEscrowWorks && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 w-full max-w-sm flex flex-col relative overflow-hidden h-[460px]"
              id="how-escrow-works-modal"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  triggerSound('click');
                  setShowHowEscrowWorks(false);
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & Badge */}
              <div className="text-left mb-4">
                <span className="text-[7px] bg-violet-100 text-violet-700 font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-violet-200">
                  Secure Trade Protocol
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">How Escrow Works</h3>
              </div>

              {/* Step Content Visuals */}
              <div className="flex-1 flex flex-col items-center justify-center py-4 text-center">
                
                {/* Step Illustrations (Dynamic visual representing each step) */}
                <div className="w-24 h-24 rounded-full bg-slate-50 border border-slate-100 shadow-inner flex items-center justify-center mb-5 relative">
                  
                  {escrowStep === 0 && (
                    <div className="flex items-center gap-3 relative animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-violet-100 border border-violet-200 flex items-center justify-center text-xs font-black">
                        👤
                      </div>
                      <div className="h-0.5 w-6 bg-linear-to-r from-violet-400 to-emerald-400" />
                      <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-black">
                        🤝
                      </div>
                    </div>
                  )}

                  {escrowStep === 1 && (
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-violet-100 rounded-full animate-ping opacity-40 scale-110" />
                      <div className="w-12 h-12 rounded-full bg-violet-600 text-white flex items-center justify-center shadow-lg relative z-10">
                        <Lock className="w-5.5 h-5.5" />
                      </div>
                    </div>
                  )}

                  {escrowStep === 2 && (
                    <div className="flex flex-col items-center gap-1.5 animate-bounce">
                      <Briefcase className="w-10 h-10 text-slate-700" />
                      <span className="text-[7px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 px-1 rounded">In Progress</span>
                    </div>
                  )}

                  {escrowStep === 3 && (
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-50" />
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg relative z-10">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Step text detail */}
                {escrowStep === 0 && (
                  <div className="space-y-1 px-2 text-left sm:text-center">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1 sm:justify-center">
                      <span>1.</span> Sign Service Agreement 🤝
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Clients and service partners agree on prices and deliverables. Our system calculates the 50% down-payment protecting both sides from day one.
                    </p>
                  </div>
                )}

                {escrowStep === 1 && (
                  <div className="space-y-1 px-2 text-left sm:text-center">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1 sm:justify-center">
                      <span>2.</span> Escrow Deposit Secured 🔒
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      The client pays the 50% deposit. The funds are held safely in DOER’s secure system, signaling financial commitment with zero immediate payment.
                    </p>
                  </div>
                )}

                {escrowStep === 2 && (
                  <div className="space-y-1 px-2 text-left sm:text-center">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1 sm:justify-center">
                      <span>3.</span> Work Protected 🛠️
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      The partner receives notification that the escrow contract is active and starts working immediately, confident that payment is already fully guaranteed.
                    </p>
                  </div>
                )}

                {escrowStep === 3 && (
                  <div className="space-y-1 px-2 text-left sm:text-center">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1 sm:justify-center">
                      <span>4.</span> Complete & Release 💰
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      When work is completed, the client approves the final submission, the remaining 50% is billed, and the entire escrowed balance transfers to the doer instantly.
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Indicator Dots */}
              <div className="flex justify-center gap-1.5 mb-6">
                {[0, 1, 2, 3].map((step) => (
                  <span
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all ${
                      escrowStep === step ? 'bg-violet-600 w-4' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Footer Stepper Controls */}
              <div className="flex gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {escrowStep > 0 && (
                  <button
                    onClick={() => {
                      triggerSound('click');
                      setEscrowStep(prev => prev - 1);
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-150 rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}

                <button
                  onClick={() => {
                    triggerSound('click');
                    if (escrowStep < 3) {
                      setEscrowStep(prev => prev + 1);
                    } else {
                      setShowHowEscrowWorks(false);
                      showToast("Escrow protection education completed! 🛡️", "success");
                    }
                  }}
                  className="flex-1 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  {escrowStep === 3 ? "Got It, Thanks!" : "Next"}
                  {escrowStep < 3 && <ChevronRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
