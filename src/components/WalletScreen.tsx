import React, { useState, useRef, useEffect } from 'react';
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
  ChevronRight,
  AlertTriangle,
  Search,
  ListFilter,
  FileText,
  Clock,
  Percent,
  Landmark,
  Users
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { GeometricDivider } from './GeometricDivider';
import { QRCodeSVG } from 'qrcode.react';
import QRCodeScannerModal from './QRCodeScannerModal';
import EarningsPieChart from './EarningsPieChart';
import EarningsWithdrawalBarChart from './EarningsWithdrawalBarChart';
import MonthlyIncomeLineChart from './MonthlyIncomeLineChart';
import EscrowD3BarChart from './EscrowD3BarChart';
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
  const [withdrawBankName, setWithdrawBankName] = useState('First National Bank (FNB)');
  const [withdrawAccountHolderName, setWithdrawAccountHolderName] = useState('');
  const [withdrawBranchCode, setWithdrawBranchCode] = useState('');
  const [withdrawAccountNum, setWithdrawAccountNum] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
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
  const [mainTab, setMainTab] = useState<'overview' | 'history'>('overview');
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'All' | 'Completed' | 'Pending' | 'Held' | 'Failed'>('All');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'All' | 'Earned' | 'Spent' | 'Escrowed'>('All');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [showQRModalTx, setShowQRModalTx] = useState<any | null>(null);

  // Auto-categorize transaction logic layer
  const getTransactionCategory = (tx: { title: string; description: string }): 'Service Fee' | 'Escrow Deposit' | 'Withdrawal' | 'Service Payment' | 'P2P Transfer' => {
    const title = (tx.title || '').toLowerCase();
    const desc = (tx.description || '').toLowerCase();

    if (title.includes('withdrawal') || desc.includes('withdrawal') || title.includes('withdrew') || desc.includes('withdrew')) {
      return 'Withdrawal';
    }
    if (title.includes('escrow') || desc.includes('escrow') || title.includes('deposit') || desc.includes('deposit') || title.includes('lock') || desc.includes('lock') || title.includes('hold') || desc.includes('hold')) {
      return 'Escrow Deposit';
    }
    if (title.includes('fee') || desc.includes('fee') || title.includes('charge') || desc.includes('charge') || title.includes('tax') || desc.includes('tax')) {
      return 'Service Fee';
    }
    if (title.includes('p2p') || desc.includes('p2p') || title.includes('transfer') || desc.includes('transfer') || title.includes('paid') || desc.includes('paid') || title.includes('received') || desc.includes('received')) {
      return 'P2P Transfer';
    }
    return 'Service Payment';
  };
  const qrRef = useRef<SVGSVGElement>(null);

  // Additional feature states
  const [showPendingPaymentPrompt, setShowPendingPaymentPrompt] = useState(false);
  const [detectedPendingRequest, setDetectedPendingRequest] = useState<any | null>(null);
  const [autoRetryEnabled, setAutoRetryEnabled] = useState<boolean>(true);

  // Auto-retry effect when balance becomes sufficient
  useEffect(() => {
    if (autoRetryEnabled && wallet.balance > 0) {
      const pendingReq = (serviceRequests || []).find(req => 
        req.bookingOwnerId === currentUser?.id &&
        ["pending_deposit", "deposit_failed", "payment_failed"].includes(req.status) &&
        (req.depositAmount || req.price * 0.5) <= wallet.balance
      );

      if (pendingReq) {
        const depositVal = pendingReq.depositAmount || pendingReq.price * 0.5;
        updateRequestStatus(pendingReq.id, "deposit_paid");
        triggerSound("success");
        showToast(`⚡ Auto-Retry Activated! Escrow deposit of R ${depositVal} locked for "${pendingReq.title}".`, "success");
      }
    }
  }, [wallet.balance, autoRetryEnabled, serviceRequests, currentUser?.id]);

  // Wrapped top-up with automatic pending escrow payment detection
  const handleTopUpWithDetection = (topUpAmount: number) => {
    topUpWallet(topUpAmount);
    
    // Search for any service request needing deposit
    const pendingReq = (serviceRequests || []).find(req => 
      req.bookingOwnerId === currentUser?.id &&
      ["pending_deposit", "deposit_failed", "payment_failed", "pending"].includes(req.status)
    );

    if (pendingReq) {
      setDetectedPendingRequest(pendingReq);
      setShowPendingPaymentPrompt(true);
      triggerSound("success");
    } else {
      showToast(`R ${topUpAmount} added to your digital wallet! 💳`, "success");
      triggerSound("success");
    }
  };

  const handleWithdraw = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setWithdrawError('Please enter a valid numeric amount to withdraw.');
      return;
    }
    if (Number(amount) > wallet.balance) {
      setWithdrawError('Insufficient funds available in your DOER wallet.');
      return;
    }
    if (!withdrawAccountHolderName.trim()) {
      setWithdrawError('Please provide the account holder name.');
      return;
    }
    if (!withdrawBranchCode.trim()) {
      setWithdrawError('Please provide your bank branch code.');
      return;
    }
    if (!withdrawAccountNum.trim()) {
      setWithdrawError('Please provide your South African bank account number.');
      return;
    }

    setWithdrawError('');
    setWithdrawing(true);
    setTimeout(() => {
      const success = requestWithdrawal(
        Number(amount),
        withdrawBankName,
        withdrawAccountNum,
        withdrawAccountHolderName,
        withdrawBranchCode
      );
      setWithdrawing(false);
      if (success) {
        setShowWithdrawModal(false);
        setAmount('');
        setWithdrawAccountNum('');
        setWithdrawAccountHolderName('');
        setWithdrawBranchCode('');
        setWithdrawError('');
      } else {
        setWithdrawError('Withdrawal failed. Check if you have enough funds.');
      }
    }, 1500);
  };

  const handleDownloadReceipt = (tx: any) => {
    try {
      const doc = new jsPDF();
      const referenceNo = `REF-ESC-${tx.id.split('-')[0].substring(0, 8).toUpperCase()}`;
      const parsedDate = safeParseDate(tx.rawDate);
      const dateFormatted = parsedDate.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('DOER.za', 15, 24);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Official Escrow & Transaction Receipt', 15, 33);

      const statusText = (tx.status || 'COMPLETED').toUpperCase();
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text(`STATUS: ${statusText}`, 140, 24);
      doc.setFont('helvetica', 'normal');
      doc.text(`Issued: ${new Date().toLocaleDateString('en-ZA')}`, 140, 32);

      // Main Info Card
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 50, 180, 40, 3, 3, 'F');

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSACTION ID', 22, 60);
      doc.text('REFERENCE NUMBER', 22, 77);
      doc.text('DATE & TIME', 115, 60);
      doc.text('PAYMENT CHANNEL', 115, 77);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(tx.id, 22, 67);
      doc.text(referenceNo, 22, 84);
      doc.text(dateFormatted, 115, 67);
      doc.text('DOER Secure Digital Wallet', 115, 84);

      // Line item box
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 98, 180, 10, 'F');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text('ITEM / DESCRIPTION', 22, 104.5);
      doc.text('TYPE', 125, 104.5);
      doc.text('AMOUNT (ZAR)', 160, 104.5);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.text(tx.title || 'DOER Transaction', 22, 116);

      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(tx.description || 'Verified Service Transaction', 22, 123);

      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(tx.type || 'Completed', 125, 116);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129); // emerald
      doc.text(`R ${tx.amount}`, 160, 116);

      // Separator
      doc.setDrawColor(226, 232, 240);
      doc.line(15, 133, 195, 133);

      // Account Owner Info
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Account Holder', 15, 145);
      
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Name: ${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`, 15, 153);
      doc.text(`Email: ${currentUser?.email || 'N/A'}`, 15, 160);
      doc.text(`User ID: ${currentUser?.id || 'N/A'}`, 15, 167);

      // Summary Box Right
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(110, 140, 85, 32, 2, 2, 'F');

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('Subtotal:', 116, 149);
      doc.text('Platform Escrow Fee:', 116, 156);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Total Settled:', 116, 165);

      doc.setFont('helvetica', 'normal');
      doc.text(`R ${tx.amount}`, 165, 149);
      doc.text('R 0.00', 165, 156);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`R ${tx.amount}`, 165, 165);

      // Footer Banner
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 262, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('DOER Secure Escrow & Audit Protection', 15, 273);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('This receipt was automatically generated and verified by DOER South Africa.', 15, 280);
      doc.text('For queries or support regarding this receipt, visit support.doer.co.za', 15, 285);

      doc.save(`DOER_Receipt_${referenceNo}.pdf`);
      showToast('PDF Receipt generated & downloaded! 📄', 'success');
      triggerSound('success');
    } catch (e) {
      logError(e);
      showToast('Error generating PDF receipt', 'error');
    }
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
      type: "Earned" | "Spent" | "Escrowed";
      title: string;
      description: string;
      amount: number;
      timestamp: string;
      rawDate: Date;
      status: "Completed" | "Pending" | "Held" | "Failed";
      requestStatus?: string;
    }[] = [];

    // 1. Process Withdrawals
    withdrawals.forEach((w) => {
      let st: "Completed" | "Pending" | "Held" | "Failed" = "Pending";
      if (w.status === "completed" || w.status === "approved" || w.status === "success") {
        st = "Completed";
      } else if (w.status === "failed" || w.status === "rejected") {
        st = "Failed";
      } else {
        st = "Pending";
      }

      list.push({
        id: w.id,
        type: "Spent",
        title: "Bank Withdrawal",
        description: `${w.bankName} • Acc: ${w.accountNumber.slice(-4).padStart(8, "*")}`,
        amount: w.amount,
        timestamp: w.createdAt,
        rawDate: safeParseDate(w.createdAt),
        status: st,
      });
    });

    // 2. Process Service Requests
    serviceRequests.forEach((req) => {
      const isClient = req.bookingOwnerId === currentUser?.id;
      const isDoer = req.doerId === currentUser?.id;

      if (isClient) {
        if (["deposit_paid", "in_progress", "awaiting_approval"].includes(req.status)) {
          list.push({
            id: `${req.id}-deposit-held`,
            type: "Escrowed",
            title: "Escrow Deposit Held",
            description: `Secured for "${req.title}" by ${req.doerName}`,
            amount: req.depositAmount,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: "Held",
            requestStatus: req.status,
          });
        } else if (req.status === "completed") {
          list.push({
            id: `${req.id}-full-held`,
            type: "Escrowed",
            title: "Full Escrow Held",
            description: `Completed job: pending release for "${req.title}"`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: "Held",
            requestStatus: req.status,
          });
        } else if (req.status === "released") {
          list.push({
            id: `${req.id}-spent`,
            type: "Spent",
            title: "Service Payment",
            description: `Released to ${req.doerName} for "${req.title}"`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: "Completed",
            requestStatus: req.status,
          });
        } else if (req.status === "cancelled" || req.status === "rejected") {
          list.push({
            id: `${req.id}-cancelled`,
            type: "Spent",
            title: "Cancelled Booking",
            description: `Booking "${req.title}" with ${req.doerName}`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: "Failed",
            requestStatus: req.status,
          });
        }
      }

      if (isDoer) {
        if (["deposit_paid", "in_progress", "awaiting_approval"].includes(req.status)) {
          list.push({
            id: `${req.id}-deposit-escrow`,
            type: "Escrowed",
            title: "Secure Escrow Locked",
            description: `50% deposit held for "${req.title}" from ${req.bookingOwnerName}`,
            amount: req.depositAmount,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: "Held",
            requestStatus: req.status,
          });
        } else if (req.status === "completed") {
          list.push({
            id: `${req.id}-full-escrow`,
            type: "Escrowed",
            title: "Awaiting Release Hold",
            description: `Completed work on "${req.title}" for ${req.bookingOwnerName}`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: "Held",
            requestStatus: req.status,
          });
        } else if (req.status === "released") {
          list.push({
            id: `${req.id}-earned`,
            type: "Earned",
            title: "Job Income Received",
            description: `Earned from ${req.bookingOwnerName} for "${req.title}"`,
            amount: req.price,
            timestamp: req.updatedAt || req.createdAt,
            rawDate: safeParseDate(req.updatedAt || req.createdAt),
            status: "Completed",
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
        type: isSender ? "Spent" : "Earned",
        title: isSender ? `Paid ${tx.recipientName}` : `Received from ${tx.senderName}`,
        description: `Instant Scan Pay • Ref: ${tx.reference}`,
        amount: tx.amount,
        timestamp: tx.createdAt,
        rawDate: safeParseDate(tx.createdAt),
        status: "Completed",
      });
    });

    const sorted = list.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    if (filterType === "All") return sorted;
    if (filterType === "Active Escrow") return sorted.filter((t) => t.type === "Escrowed");
    if (filterType === "Released Funds") return sorted.filter((t) => t.type === "Earned");
    return sorted;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      <div className="bg-zinc-900 px-5 sm:px-6 pt-8 sm:pt-12 pb-5 sm:pb-8 rounded-b-[24px] sm:rounded-b-[32px] relative overflow-hidden shrink-0">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand rounded-full blur-3xl mix-blend-screen"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full blur-3xl mix-blend-screen"></div>
        </div>
        
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1 bg-white/10 text-white/90 text-[9px] sm:text-[10px] font-black uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full mb-2.5 sm:mb-4">
            <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            DOER Wallet
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-0.5 sm:mb-1">
            R {wallet.balance}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-white/60">Available Balance</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button 
              onClick={() => handleTopUpWithDetection(1000)}
              className="bg-brand text-zinc-900 py-2.5 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-brand-hover transition-all shadow-md shadow-brand/10 cursor-pointer">
              <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Top Up
            </button>
            <button 
              onClick={() => {
                triggerSound('click');
                setShowWithdrawModal(true);
              }}
              className="bg-white/10 text-white border border-white/20 py-2.5 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-white/20 transition-all cursor-pointer">
              <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Withdraw
            </button>
            <button 
              onClick={() => {
                triggerSound('click');
                setShowScannerModal(true);
              }}
              className="bg-emerald-500 text-zinc-950 py-2.5 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/5 cursor-pointer">
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Scan & Pay
            </button>
            <button 
              onClick={() => {
                triggerSound('click');
                setShowReceiveModal(true);
              }}
              className="bg-zinc-800 text-white border border-zinc-750 py-2.5 sm:py-3.5 px-2 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wide flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-zinc-700 transition-all cursor-pointer">
              <QrCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              Receive Code
            </button>
          </div>
        </div>
      </div>
            {/* Wallet Sub-Navigation Tabs */}
      <div className="px-6 pt-4 bg-slate-50 shrink-0">
        <div className="flex bg-slate-200/80 p-1 rounded-2xl gap-1 border border-slate-200/80">
          <button
            onClick={() => {
              triggerSound("click");
              setMainTab("overview");
            }}
            className={`flex-1 py-2.5 text-center rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mainTab === "overview"
                ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wallet className="w-4 h-4" />
            Overview
          </button>
          <button
            onClick={() => {
              triggerSound("click");
              setMainTab("history");
            }}
            className={`flex-1 py-2.5 text-center rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 ${
              mainTab === "history"
                ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListFilter className="w-4 h-4" />
            Transaction Log
          </button>
        </div>
      </div>
<div className="flex-1 overflow-y-auto p-6 pb-24 space-y-6">
        {/* Low Wallet Balance Threshold Warning Banner */}
        {wallet.balance < 100 && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50/90 border-2 border-amber-300/80 p-4.5 rounded-[24px] flex items-start gap-3.5 shadow-xs"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  Low Balance Notice
                </h4>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-amber-200/90 text-amber-950 rounded-full border border-amber-400/40">
                  R {wallet.balance}
                </span>
              </div>
              <p className="text-[11px] font-bold text-amber-900/85 leading-relaxed mt-1">
                Your wallet balance is below R 100. We encourage you to top up before starting a new job to ensure seamless escrow security deposits and booking payments.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => {
                    triggerSound("click");
                    handleTopUpWithDetection(1000);
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Top Up R 1,000 Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
        {/* Overview Tab Wrap */}
        {mainTab === "overview" && (
          <div className="space-y-6">

        {/* Active Escrow Held Funds & Job Lifecycle Progress Chart */}
        <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                <GeometricDivider variant="accent" />
                Escrow Held Funds & Job Lifecycle
              </h3>
              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                Visual timeline tracking 50% security deposit lock through to final job payout.
              </p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-violet-100 text-violet-800 rounded-full border border-violet-200 flex items-center gap-1">
              <Shield className="w-3 h-3 text-violet-600" />
              Verified Escrow
            </span>
          </div>

          {(() => {
            const activeEscrowJobs = (serviceRequests || []).filter(req => 
              (req.bookingOwnerId === currentUser?.id || req.doerId === currentUser?.id) &&
              ["deposit_paid", "in_progress", "awaiting_approval", "completed", "released"].includes(req.status)
            );

            if (activeEscrowJobs.length === 0) {
              return (
                <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-1.5 py-8">
                  <Lock className="w-6 h-6 text-slate-300 mx-auto" />
                  <span className="block text-xs font-black text-slate-700">No Active Escrow Holds</span>
                  <p className="text-[10px] font-bold text-slate-400 max-w-xs mx-auto">
                    When you accept a job or make a booking, the 50% escrow deposit will appear here with live timeline progress.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {activeEscrowJobs.map((job) => {
                  const isClient = job.bookingOwnerId === currentUser?.id;
                  const isDoer = job.doerId === currentUser?.id;
                  const deposit = job.depositAmount || job.price * 0.5;

                  // Determine stage step index (1 to 4)
                  let stepIndex = 1; // 1: Deposit Paid, 2: In Progress, 3: Awaiting Approval, 4: Released
                  if (job.status === "in_progress") stepIndex = 2;
                  else if (job.status === "awaiting_approval" || job.status === "completed") stepIndex = 3;
                  else if (job.status === "released") stepIndex = 4;

                  const progressPercent = stepIndex === 1 ? 25 : stepIndex === 2 ? 50 : stepIndex === 3 ? 75 : 100;

                  return (
                    <div 
                      key={job.id} 
                      className="bg-slate-50/80 p-4.5 rounded-[22px] border border-slate-200/70 space-y-3 relative overflow-hidden"
                    >
                      {/* Job Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
                            {isClient ? "Client Booking" : "Service Partner"}
                          </span>
                          <h4 className="text-xs font-black text-slate-900 mt-1">{job.title}</h4>
                          <p className="text-[10px] text-slate-500 font-bold">
                            {isClient ? `Service Partner: ${job.doerName}` : `Client: ${job.bookingOwnerName}`}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-600 block">
                            R {deposit} <span className="text-[9px] font-bold text-slate-400">Held</span>
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 block">
                            Total: R {job.price}
                          </span>
                        </div>
                      </div>

                      {/* Visual Timeline Progress Bar */}
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-500">
                          <span>Job Lifecycle Progress</span>
                          <span className="text-violet-700 font-bold">{progressPercent}% Completed</span>
                        </div>

                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden relative">
                          <div 
                            className="bg-linear-to-r from-violet-600 via-indigo-500 to-emerald-500 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* 4 Step Lifecycle Timeline Nodes */}
                        <div className="grid grid-cols-4 gap-1 pt-2 text-center">
                          {/* Step 1 */}
                          <div className="space-y-1">
                            <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-black transition-all ${
                              stepIndex >= 1 ? "bg-violet-600 text-white shadow-xs" : "bg-slate-200 text-slate-400"
                            }`}>
                              <Lock className="w-3 h-3" />
                            </div>
                            <span className="block text-[8px] font-extrabold text-slate-700 leading-tight">1. Deposit Locked</span>
                            <span className="block text-[7px] font-bold text-slate-400">50% Escrow</span>
                          </div>

                          {/* Step 2 */}
                          <div className="space-y-1">
                            <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-black transition-all ${
                              stepIndex >= 2 ? "bg-indigo-600 text-white shadow-xs" : "bg-slate-200 text-slate-400"
                            }`}>
                              <Briefcase className="w-3 h-3" />
                            </div>
                            <span className="block text-[8px] font-extrabold text-slate-700 leading-tight">2. In Progress</span>
                            <span className="block text-[7px] font-bold text-slate-400">Work Active</span>
                          </div>

                          {/* Step 3 */}
                          <div className="space-y-1">
                            <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-black transition-all ${
                              stepIndex >= 3 ? "bg-amber-500 text-white shadow-xs animate-pulse" : "bg-slate-200 text-slate-400"
                            }`}>
                              <CheckCircle className="w-3 h-3" />
                            </div>
                            <span className="block text-[8px] font-extrabold text-slate-700 leading-tight">3. Proof Submitted</span>
                            <span className="block text-[7px] font-bold text-slate-400">Awaiting Approval</span>
                          </div>

                          {/* Step 4 */}
                          <div className="space-y-1">
                            <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-[10px] font-black transition-all ${
                              stepIndex >= 4 ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-400"
                            }`}>
                              <ArrowUpRight className="w-3 h-3" />
                            </div>
                            <span className="block text-[8px] font-extrabold text-slate-700 leading-tight">4. Funds Released</span>
                            <span className="block text-[7px] font-bold text-slate-400">100% Settled</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons if applicable */}
                      <div className="pt-1 flex justify-end gap-2">
                        {isClient && (job.status === "awaiting_approval" || job.status === "completed") && (
                          <button
                            onClick={() => {
                              triggerSound("click");
                              updateRequestStatus(job.id, "released");
                              showToast(`Full payment of R ${job.price} released to ${job.doerName}! 🎉`, "success");
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Approve & Release R {job.price}
                          </button>
                        )}

                        {isDoer && job.status === "in_progress" && (
                          <button
                            onClick={() => {
                              triggerSound("click");
                              updateRequestStatus(job.id, "awaiting_approval");
                              showToast("Completion proof submitted to client for approval! 📄", "success");
                            }}
                            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Submit Completion Proof
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
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

        <EarningsWithdrawalBarChart 
          serviceRequests={serviceRequests}
          p2pTransfers={p2pTransfers}
          withdrawals={withdrawals}
          currentUserId={currentUser?.id || ''}
        />

        <MonthlyIncomeLineChart 
          serviceRequests={serviceRequests}
          p2pTransfers={p2pTransfers}
          currentUserId={currentUser?.id || ''}
        />

        <EscrowD3BarChart 
          serviceRequests={serviceRequests}
          currentUser={currentUser}
        />

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
                <div className="bg-white p-6 rounded-[24px] border border-slate-100 text-center py-10 shadow-2xs flex flex-col items-center">
                  <img
                    src="/src/assets/images/wallet_empty_1784804894329.jpg"
                    alt="No transactions found"
                    referrerPolicy="no-referrer"
                    className="w-40 h-40 object-contain mb-4 rounded-xl"
                  />
                  <p className="text-slate-700 font-extrabold text-sm">No transactions found</p>
                  <p className="text-slate-400 font-semibold text-xs mt-1 max-w-xs leading-relaxed">
                    You haven't completed any "{filterType}" transactions yet. Funds released or escrowed will appear here.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {txs.map((tx) => {
                  const cat = getTransactionCategory(tx);
                  let iconEl = null;
                  let iconBg = '';

                  if (cat === 'Withdrawal') {
                    iconEl = <Landmark className="w-4.5 h-4.5 text-rose-600" />;
                    iconBg = 'bg-rose-50 border border-rose-100';
                  } else if (cat === 'Escrow Deposit') {
                    iconEl = <Lock className="w-4.5 h-4.5 text-violet-600" />;
                    iconBg = 'bg-violet-50 border border-violet-100';
                  } else if (cat === 'Service Fee') {
                    iconEl = <Percent className="w-4.5 h-4.5 text-rose-600" />;
                    iconBg = 'bg-rose-50 border border-rose-100';
                  } else if (cat === 'P2P Transfer') {
                    const isEarned = tx.type === 'Earned';
                    iconEl = <Users className={`w-4.5 h-4.5 ${isEarned ? 'text-emerald-600' : 'text-rose-600'}`} />;
                    iconBg = isEarned ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100';
                  } else {
                    const isEarned = tx.type === 'Earned';
                    iconEl = <Briefcase className={`w-4.5 h-4.5 ${isEarned ? 'text-emerald-600' : 'text-rose-600'}`} />;
                    iconBg = isEarned ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100';
                  }

                  let amountColor = tx.type === 'Earned' ? 'text-emerald-600' : tx.type === 'Spent' ? 'text-rose-600' : 'text-violet-600';
                  let amountPrefix = tx.type === 'Earned' ? '+ ' : tx.type === 'Spent' ? '- ' : '';

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
                        <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
                          {iconEl}
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="text-xs font-black text-slate-800 block truncate">{tx.title}</span>
                          <span className="text-[10px] text-slate-500 font-semibold block truncate leading-tight mt-0.5">{tx.description}</span>
                          
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-150 px-1.5 py-0.5 rounded-md">
                              🏷️ {cat}
                            </span>
                            {tx.requestStatus && (
                              ['deposit_paid', 'in_progress', 'awaiting_approval', 'completed'].includes(tx.requestStatus) ? (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-violet-50 text-violet-700 border border-violet-100/50 px-1.5 py-0.5 rounded-full">
                                  <Shield className="w-2 h-2" /> Escrow Secured
                                </span>
                              ) : tx.requestStatus === 'released' ? (
                                <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100/50 px-1.5 py-0.5 rounded-full">
                                  <CheckCircle className="w-2 h-2" /> Payment Received by Doer
                                </span>
                              ) : null
                            )}
                          </div>
                          
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
        )}

        {/* Detailed Paginated Transaction Log Tab */}
        {mainTab === "history" && (
          <div className="space-y-6 text-left">
            {/* Header & Subtitle */}
            <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-xs space-y-3">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <GeometricDivider variant="accent" />
                  Transaction History & Receipts
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Search, filter, and download official PDF receipts for any completed wallet transaction.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => {
                    setHistorySearch(e.target.value);
                    setHistoryPage(1);
                  }}
                  placeholder="Search by ID, title, reference, or description..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand focus:bg-white transition-all" />
                {historySearch && (
                  <button
                    onClick={() => {
                      setHistorySearch("");
                      setHistoryPage(1);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Date Range Selector */}
              <div className="bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100 mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Start Date</span>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => {
                        triggerSound('click');
                        setHistoryStartDate(e.target.value);
                        setHistoryPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 focus:outline-none focus:border-brand transition-all cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">End Date</span>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => {
                        triggerSound('click');
                        setHistoryEndDate(e.target.value);
                        setHistoryPage(1);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 focus:outline-none focus:border-brand transition-all cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Date Range Filters */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Presets:</span>
                  <button
                    onClick={() => {
                      triggerSound('click');
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 7);
                      setHistoryStartDate(start.toISOString().split('T')[0]);
                      setHistoryEndDate(end.toISOString().split('T')[0]);
                      setHistoryPage(1);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-[8px] font-black text-slate-650 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      triggerSound('click');
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 30);
                      setHistoryStartDate(start.toISOString().split('T')[0]);
                      setHistoryEndDate(end.toISOString().split('T')[0]);
                      setHistoryPage(1);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-[8px] font-black text-slate-650 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      triggerSound('click');
                      const end = new Date();
                      const start = new Date();
                      start.setDate(end.getDate() - 90);
                      setHistoryStartDate(start.toISOString().split('T')[0]);
                      setHistoryEndDate(end.toISOString().split('T')[0]);
                      setHistoryPage(1);
                    }}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:border-slate-300 rounded-md text-[8px] font-black text-slate-650 hover:text-slate-800 transition-all cursor-pointer"
                  >
                    Last 90 Days
                  </button>
                </div>
              </div>

              {(historyStartDate || historyEndDate) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      triggerSound('click');
                      setHistoryStartDate('');
                      setHistoryEndDate('');
                      setHistoryPage(1);
                    }}
                    className="text-[9px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  >
                    Clear Date Filter ✕
                  </button>
                </div>
              )}

              {/* Status & Type Filter Pills */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Status:</span>
                  {(["All", "Completed", "Pending", "Held", "Failed"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        triggerSound("click");
                        setHistoryStatusFilter(st);
                        setHistoryPage(1);
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                        historyStatusFilter === st
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-3xs"
                          : "bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200/80"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 shrink-0">Type:</span>
                  {(["All", "Earned", "Spent", "Escrowed"] as const).map((tp) => (
                    <button
                      key={tp}
                      onClick={() => {
                        triggerSound("click");
                        setHistoryTypeFilter(tp);
                        setHistoryPage(1);
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border shrink-0 cursor-pointer ${
                        historyTypeFilter === tp
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-3xs"
                          : "bg-slate-50 text-slate-500 hover:text-slate-800 border-slate-200/80"
                      }`}
                    >
                      {tp === "Earned" ? "💰 Earned" : tp === "Spent" ? "💸 Spent" : tp === "Escrowed" ? "🔒 Escrowed" : "📂 All Types"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Paginated Transactions List */}
            {(() => {
              const allTxs = getTransactions();
              const filteredTxs = allTxs.filter((tx) => {
                if (historySearch.trim()) {
                  const q = historySearch.toLowerCase();
                  const matchTitle = tx.title.toLowerCase().includes(q);
                  const matchDesc = tx.description.toLowerCase().includes(q);
                  const matchId = tx.id.toLowerCase().includes(q);
                  if (!matchTitle && !matchDesc && !matchId) return false;
                }
                if (historyStatusFilter !== "All" && tx.status !== historyStatusFilter) {
                  return false;
                }
                if (historyTypeFilter !== "All" && tx.type !== historyTypeFilter) {
                  return false;
                }
                if (historyStartDate) {
                  const start = new Date(historyStartDate + "T00:00:00");
                  if (tx.rawDate < start) return false;
                }
                if (historyEndDate) {
                  const end = new Date(historyEndDate + "T23:59:59");
                  if (tx.rawDate > end) return false;
                }
                return true;
              });

              const itemsPerPage = 8;
              const totalPages = Math.max(1, Math.ceil(filteredTxs.length / itemsPerPage));
              const currentPage = Math.min(historyPage, totalPages);
              const paginated = filteredTxs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

              if (filteredTxs.length === 0) {
                return (
                  <div className="bg-white p-8 rounded-[28px] border border-slate-100 text-center text-slate-400 font-semibold text-xs py-12 shadow-xs space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <span className="block font-black text-slate-700 text-sm">No Matching Transactions</span>
                    <p className="text-[10px] text-slate-400 font-bold max-w-xs mx-auto">
                      Try adjusting your search query or status filter to see more transaction logs.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <span>Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTxs.length)} of {filteredTxs.length} records</span>
                    <span>Page {currentPage} of {totalPages}</span>
                  </div>

                  {paginated.map((tx) => {
                    let statusBadgeColor = "";
                    if (tx.status === "Completed") statusBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                    else if (tx.status === "Pending") statusBadgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                    else if (tx.status === "Held") statusBadgeColor = "bg-violet-50 text-violet-700 border-violet-200";
                    else statusBadgeColor = "bg-rose-50 text-rose-700 border-rose-200";

                    let typeBadgeColor = "";
                    if (tx.type === "Earned") typeBadgeColor = "bg-emerald-100 text-emerald-800";
                    else if (tx.type === "Spent") typeBadgeColor = "bg-rose-100 text-rose-800";
                    else typeBadgeColor = "bg-violet-100 text-violet-800";

                    const formattedDate = safeParseDate(tx.rawDate).toLocaleDateString([], {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    }) + " • " + safeParseDate(tx.rawDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                    return (
                      <div
                        key={tx.id}
                        className="bg-white p-4.5 rounded-[24px] border border-slate-100 shadow-xs hover:border-slate-200 transition-all space-y-3"
                      >
                        {/* Top row: ID, Date, Status */}
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                              {tx.id}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {formattedDate}
                            </span>
                          </div>

                          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusBadgeColor}`}>
                            {tx.status}
                          </span>
                        </div>

                        {/* Middle row: Title, Description, Type, Amount */}
                        {(() => {
                          const cat = getTransactionCategory(tx);
                          return (
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0 flex-1">
                                <h4 className="text-xs font-black text-slate-900 leading-snug">{tx.title}</h4>
                                <p className="text-[10.5px] font-semibold text-slate-500 leading-normal">{tx.description}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${typeBadgeColor}`}>
                                    {tx.type}
                                  </span>
                                  <span className="inline-block text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-150 px-2 py-0.5 rounded-md">
                                    🏷️ {cat}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-sm font-black block ${tx.type === "Earned" ? "text-emerald-600" : tx.type === "Spent" ? "text-rose-600" : "text-violet-600"}`}>
                                  {tx.type === "Earned" ? "+ " : tx.type === "Spent" ? "- " : ""}R {tx.amount}
                                </span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">ZAR Currency</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Bottom action row */}
                        
                        {/* Error Diagnostic Box for Failed Transactions */}
                        {tx.status === "Failed" && (
                          <div className="bg-rose-50/90 border border-rose-200 p-3.5 rounded-2xl text-left space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-wider text-rose-800 bg-rose-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-700" />
                                ERR_ESCROW_INSUFFICIENT_BAL_402
                              </span>
                              <span className="text-[9px] font-bold text-rose-600">Diagnostic Result</span>
                            </div>

                            <p className="text-[10.5px] font-bold text-rose-900 leading-snug">
                              Wallet balance (R ${wallet.balance}) was less than required deposit of R ${tx.amount}.
                            </p>

                            <div className="flex items-center justify-between pt-1 border-t border-rose-200/60">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-600">Auto-Retry:</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerSound("click");
                                    setAutoRetryEnabled(!autoRetryEnabled);
                                    showToast(autoRetryEnabled ? "Auto-Retry disabled" : "Auto-Retry enabled!", "info");
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                                    autoRetryEnabled ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {autoRetryEnabled ? "ON ⚡" : "OFF"}
                                </button>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerSound("click");
                                  handleTopUpWithDetection(Math.max(100, tx.amount - wallet.balance));
                                }}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                Top Up Deficit
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            onClick={() => {
                              triggerSound("click");
                              setSelectedTx(tx);
                            }}
                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition-all cursor-pointer"
                          >
                            View Details
                          </button>

                          {tx.status === "Completed" && (
                            <>
                              <button
                                onClick={() => {
                                  triggerSound("click");
                                  setShowQRModalTx(tx);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <QrCode className="w-3 h-3" />
                                Generate QR
                              </button>
                              <button
                                onClick={() => {
                                  triggerSound("click");
                                  handleDownloadReceipt(tx);
                                }}
                                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              >
                                <Download className="w-3 h-3" />
                                PDF Receipt
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination Navigation Bar */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 mt-4 shadow-xs">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => {
                          triggerSound("click");
                          setHistoryPage((p) => Math.max(1, p - 1));
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-extrabold text-[10px] rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                          <button
                            key={p}
                            onClick={() => {
                              triggerSound("click");
                              setHistoryPage(p);
                            }}
                            className={`w-7 h-7 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                              currentPage === p
                                ? "bg-zinc-900 text-white shadow-3xs"
                                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>

                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          triggerSound("click");
                          setHistoryPage((p) => Math.min(totalPages, p + 1));
                        }}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 font-extrabold text-[10px] rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

      </div>
      {showWithdrawModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 w-full max-w-md shadow-2xl relative border border-slate-100 flex flex-col my-auto"
          >
            {/* Header */}
            <div className="mb-4 text-left">
              <h2 className="text-xl font-black text-slate-900">ZAR Bank Withdrawal</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Transfer funds securely from your DOER wallet to your bank account.
              </p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              {/* Row 1: Amount & Bank Name */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Amount (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">R</span>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-7 pr-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-brand focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Bank Name
                  </label>
                  <select
                    value={withdrawBankName}
                    onChange={(e) => setWithdrawBankName(e.target.value)}
                    className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-brand focus:bg-white transition-all h-[38px]"
                  >
                    <option>First National Bank (FNB)</option>
                    <option>Standard Bank</option>
                    <option>Capitec Bank</option>
                    <option>Nedbank</option>
                    <option>Absa</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Account Holder Name & Branch Code */}
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Doe"
                    value={withdrawAccountHolderName}
                    onChange={(e) => setWithdrawAccountHolderName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Branch Code *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 250655"
                    value={withdrawBranchCode}
                    onChange={(e) => setWithdrawBranchCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Row 3: Account Number */}
              <div className="text-left">
                <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 62123456789"
                  value={withdrawAccountNum}
                  onChange={(e) => setWithdrawAccountNum(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-brand focus:bg-white transition-all"
                />
              </div>

              {/* Fee breakdown & final payout */}
              {parsedAmount > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5 text-left">
                  <div className="flex justify-between text-[11px] font-bold text-slate-500">
                    <span>Service Fee ({withdrawalFeePercentage}%)</span>
                    <span>R {feeAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-900 border-t border-slate-200 pt-1.5 mt-1.5">
                    <span>Final Payout</span>
                    <span>R {payoutAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {withdrawError && (
                <p className="text-[11px] font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-left">
                  ⚠️ {withdrawError}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setWithdrawError('');
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl font-black text-xs transition-colors uppercase tracking-wide"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={withdrawing || !amount || Number(amount) <= 0 || !withdrawAccountNum.trim() || !withdrawAccountHolderName.trim() || !withdrawBranchCode.trim()}
                  className={`flex-1 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 transition-all uppercase tracking-wide shadow-md ${
                    withdrawing || !amount || Number(amount) <= 0 || !withdrawAccountNum.trim() || !withdrawAccountHolderName.trim() || !withdrawBranchCode.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'
                  }`}
                >
                  {withdrawing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...
                    </>
                  ) : (
                    <>Request Instant Payout 🚀</>
                  )}
                </button>
              </div>
            </form>
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

            
              {/* Diagnostic Box inside Details Modal if Failed */}
              {selectedTx.status === "Failed" && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 text-xs text-left mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-rose-800 bg-rose-200 px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-700" />
                      Diagnostic Code: ERR_ESCROW_INSUFFICIENT_FUNDS_402
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-rose-950 uppercase tracking-wider block">Root Cause Analysis</span>
                    <p className="text-[11px] font-bold text-rose-900 leading-snug">
                      Escrow deposit could not be completed because available wallet balance (R ${wallet.balance}) was lower than required transaction amount (R ${selectedTx.amount}).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-rose-950 uppercase tracking-wider block">Diagnostic Resolution</span>
                    <p className="text-[10.5px] font-medium text-rose-800 leading-snug">
                      Top up your wallet by at least R ${Math.max(0, selectedTx.amount - wallet.balance)} or enable the Auto-Retry engine below.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-rose-200/80">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-800">Auto-Retry Engine:</span>
                      <button
                        onClick={() => {
                          triggerSound("click");
                          setAutoRetryEnabled(!autoRetryEnabled);
                          showToast(autoRetryEnabled ? "Auto-Retry engine turned OFF" : "Auto-Retry engine turned ON!", "info");
                        }}
                        className={`px-3 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          autoRetryEnabled
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {autoRetryEnabled ? "Enabled ⚡" : "Disabled"}
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        triggerSound("click");
                        handleTopUpWithDetection(Math.max(500, selectedTx.amount - wallet.balance));
                        setSelectedTx(null);
                      }}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
                    >
                      Top Up & Retry
                    </button>
                  </div>
                </div>
              )}
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

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              <button 
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs text-center transition-colors uppercase tracking-wide cursor-pointer"
              >
                Close
              </button>
              {selectedTx.status === "Completed" && (
                <button 
                  onClick={() => {
                    triggerSound("click");
                    setShowQRModalTx(selectedTx);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/15 uppercase tracking-wide cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  QR Code
                </button>
              )}
              <button 
                onClick={() => handleDownloadReceipt(selectedTx)}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-600/15 uppercase tracking-wide cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Receipt
              </button>
            </div>
          </motion.div>
        </div>
      )}

      
      {/* Pending Payment Detected Prompt Modal */}
      <AnimatePresence>
        {showPendingPaymentPrompt && detectedPendingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 w-full max-w-sm flex flex-col relative text-left"
            >
              <button
                onClick={() => {
                  triggerSound("click");
                  setShowPendingPaymentPrompt(false);
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCircle className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <span className="text-[8px] bg-emerald-100 text-emerald-800 font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Top-Up Successful
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-0.5">Pending Payment Detected</h3>
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-600 leading-relaxed mb-4">
                Your wallet balance is now <span className="font-black text-slate-900">R {wallet.balance}</span>. We detected a pending escrow deposit requirement for job <span className="font-black text-slate-900">"{detectedPendingRequest.title}"</span>.
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 mb-5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">Required Deposit</span>
                  <span className="font-black text-slate-900 text-sm">
                    R {detectedPendingRequest.depositAmount || detectedPendingRequest.price * 0.5}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">Total Contract Price</span>
                  <span className="font-bold text-slate-700">R {detectedPendingRequest.price}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-bold uppercase text-[9px]">Remaining Balance After Lock</span>
                  <span className="font-black text-emerald-600">
                    R {Math.max(0, wallet.balance - (detectedPendingRequest.depositAmount || detectedPendingRequest.price * 0.5))}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={() => {
                    triggerSound("click");
                    setShowPendingPaymentPrompt(false);
                  }}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Later
                </button>
                <button
                  onClick={() => {
                    triggerSound("click");
                    updateRequestStatus(detectedPendingRequest.id, "deposit_paid");
                    setShowPendingPaymentPrompt(false);
                    triggerSound("success");
                    showToast(`Finalized! R ${detectedPendingRequest.depositAmount || detectedPendingRequest.price * 0.5} escrow deposit locked for "${detectedPendingRequest.title}".`, "success");
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                  Finalize Deposit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
      {/* Instant Verification QR Code Modal Overlay */}
      <AnimatePresence>
        {showQRModalTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] border border-slate-100 shadow-2xl p-6 w-full max-w-sm flex flex-col relative text-center"
            >
              {/* Close Button */}
              <button
                onClick={() => {
                  triggerSound('click');
                  setShowQRModalTx(null);
                }}
                className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title */}
              <div className="text-left mb-4">
                <span className="text-[7px] bg-emerald-100 text-emerald-800 font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Instant Verification
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">Scan to Verify</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-normal">
                  Show this QR code to the service provider. Scanning it instantly verifies transaction completion.
                </p>
              </div>

              {/* QR Code Container */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 inline-flex items-center justify-center mb-4 mx-auto shadow-inner">
                <QRCodeSVG 
                  value={JSON.stringify({
                    id: showQRModalTx.id,
                    amount: showQRModalTx.amount,
                    title: showQRModalTx.title,
                    type: showQRModalTx.type,
                    timestamp: showQRModalTx.rawDate ? showQRModalTx.rawDate.getTime() : Date.now()
                  })} 
                  size={180} 
                  level="H"
                />
              </div>

              {/* Transaction Meta Card */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left space-y-2.5 mb-5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Transaction ID</span>
                  <span className="font-mono text-[9px] font-black text-slate-800 max-w-[160px] truncate">
                    {showQRModalTx.id}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Title</span>
                  <span className="font-black text-slate-800 truncate max-w-[160px]">
                    {showQRModalTx.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Verified Amount</span>
                  <span className="font-black text-slate-900">
                    R {showQRModalTx.amount}
                  </span>
                </div>
              </div>

              {/* Action Close */}
              <button
                onClick={() => {
                  triggerSound('click');
                  setShowQRModalTx(null);
                }}
                className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm"
              >
                Close Scanner Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
