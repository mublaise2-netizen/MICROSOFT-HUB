import React, { useState, useEffect, useRef } from "react";
import {
  Home as HomeIcon,
  ArrowUpCircle,
  TrendingUp,
  ArrowDownCircle,
  User,
  Wallet,
  Sparkles,
  Gift,
  Award,
  MessageSquare,
  Moon,
  Sun,
  Check,
  AlertCircle,
  PhoneCall,
  Clock,
  RotateCcw,
  DollarSign,
  Layers,
  CheckCircle,
  Copy,
  ChevronRight,
  ShieldCheck,
  Zap,
  CalendarCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { products, mockTickerMessages } from "./data";
import {
  InvestmentProduct,
  UserState,
  ActiveInvestment,
  Transaction,
} from "./types";
import { supabase } from "./lib/supabase";

export default function App() {
  // --- STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authView, setAuthView] = useState<"signin" | "signup">("signin");
  const [authPhone, setAuthPhone] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authInviteCode, setAuthInviteCode] = useState<string>("");
  const [currentTab, setCurrentTab] = useState<
    "home" | "deposit" | "invest" | "withdraw" | "account" | "invite"
  >("home");
  const [accountTab, setAccountTab] = useState<"overview" | "history">(
    "overview",
  );
  const [accountPhone, setAccountPhone] = useState(
    () => localStorage.getItem("mh_account_phone") || "",
  );
  const [accountName, setAccountName] = useState(
    () => localStorage.getItem("mh_account_name") || "",
  );
  const [paymentMethod, setPaymentMethod] = useState<"mtn" | "airtel">(
    () =>
      (localStorage.getItem("mh_payment_method") as "mtn" | "airtel") || "mtn",
  );
  const [depositStep, setDepositStep] = useState<
    "amount" | "method" | "confirm"
  >("amount");
  const [depositPhoneInput, setDepositPhoneInput] = useState<string>("");
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem("mh_v2_balance");
    return saved ? parseInt(saved, 10) : 2500;
  });
  const [totalDeposit, setTotalDeposit] = useState<number>(() => {
    const saved = localStorage.getItem("mh_v2_total_deposit");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [totalWithdraw, setTotalWithdraw] = useState<number>(() => {
    const saved = localStorage.getItem("mh_v2_total_withdraw");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [activeInvestments, setActiveInvestments] = useState<
    ActiveInvestment[]
  >(() => {
    const saved = localStorage.getItem("mh_v2_active_investments");
    return saved ? JSON.parse(saved) : [];
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("mh_v2_transactions");
    return saved ? JSON.parse(saved) : [];
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("mh_dark_mode");
    return saved ? saved === "true" : false;
  });

  // UI Interactive States
  const [tickerIndex, setTickerIndex] = useState(0);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositMethod, setDepositMethod] = useState<"MTN" | "Airtel">("MTN");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<"MTN" | "Airtel">("MTN");
  const [withdrawPhone, setWithdrawPhone] = useState<string>("078");
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  // Lucky Draw State
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);

  // Active Support Drawer State
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    Array<{ sender: "user" | "agent"; text: string; time: string }>
  >([
    {
      sender: "agent",
      text: "Hello! Welcome to Microsoft Hub support. How can I assist you with your investments today?",
      time: "Just now",
    },
  ]);

  // Modal investment confirmation state
  const [confirmingProduct, setConfirmingProduct] =
    useState<InvestmentProduct | null>(null);

  // Daily Check-in state
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(() => {
    const lastCheckin = localStorage.getItem("mh_last_checkin_date");
    return lastCheckin === new Date().toDateString();
  });

  // Persistence effects
  useEffect(() => {
    const loadUserData = async (userId: string) => {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance, total_deposit, total_withdraw, full_name, phone")
        .eq("id", userId)
        .single();
        
      if (profile) {
        let currentBalance = profile.balance !== null ? Number(profile.balance) : 0;
        
        // Retroactively add 2500 Frw to accounts that were created before the default balance was updated to 2500
        if (currentBalance === 0 && profile.total_deposit === 0 && profile.total_withdraw === 0) {
          currentBalance = 2500;
          await supabase.from("profiles").update({ balance: 2500 }).eq("id", userId);
        }
        
        setBalance(currentBalance);
        setTotalDeposit(profile.total_deposit || 0);
        setTotalWithdraw(profile.total_withdraw || 0);
        if (profile.full_name) setAccountName(profile.full_name);
        if (profile.phone) setAccountPhone(profile.phone);
      }

      // Fetch transactions
      const { data: txs } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (txs && txs.length > 0) {
        setTransactions(
          txs.map((t: any) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            method: t.method || "",
            details: t.details || "",
            createdAt: t.created_at,
          }))
        );
      } else {
        setTransactions([]);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsLoggedIn(true);
        loadUserData(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        loadUserData(session.user.id);
      } else {
        // Reset to default if logged out
        setBalance(2500);
        setTotalDeposit(0);
        setTotalWithdraw(0);
        setTransactions([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("mh_v2_balance", balance.toString());
  }, [balance]);

  useEffect(() => {
    localStorage.setItem("mh_v2_total_deposit", totalDeposit.toString());
  }, [totalDeposit]);

  useEffect(() => {
    localStorage.setItem("mh_v2_total_withdraw", totalWithdraw.toString());
  }, [totalWithdraw]);

  useEffect(() => {
    localStorage.setItem(
      "mh_v2_active_investments",
      JSON.stringify(activeInvestments),
    );
  }, [activeInvestments]);

  useEffect(() => {
    localStorage.setItem("mh_v2_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("mh_dark_mode", darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Announcement ticker cycling
  useEffect(() => {
    const tickerTimer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % mockTickerMessages.length);
    }, 4500);
    return () => clearInterval(tickerTimer);
  }, []);

  // Live profit generation simulation!
  // To simulate active plans generating real income in real-time,
  // we tick every 1 second and calculate pending earnings, adding them to balance!
  // Since 1 day = 86400 seconds, every second an active investment yields:
  // dailyIncome / 86400 Frw.
  // We can let them harvest this manually (with a "Collect" button) inside the Account tab,
  // which is extremely engaging and satisfying, or add a real-time incrementer.
  // Let's create an "uncollected earnings" state that recalculates based on time,
  // or a system that updates every second! Let's do a live interval that updates local states.
  const [liveEarnings, setLiveEarnings] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeInvestments.length === 0) return;

      // Accumulate a small amount of live earnings
      // Let's speed it up slightly (e.g. 10x real-time) or keep it accurate.
      // Let's make it highly satisfying: 1 Frw every few seconds per investment
      // so it visibly increases!
      let addedProfit = 0;
      activeInvestments.forEach((inv) => {
        // Real-time daily rate: dailyIncome / 86400
        // Let's accelerate the simulation * 20 so users see profits accumulate beautifully!
        const yieldPerSec = (inv.dailyIncome / 86400) * 12; // 12x speed multiplier for visual feedback
        addedProfit += yieldPerSec;
      });

      setLiveEarnings((prev) => prev + addedProfit);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeInvestments]);

  // Helper formatting function
  const formatFrw = (num: number) => {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(num)) + " Frw"
    );
  };

  const showToast = (
    text: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToastMessage({ text, type });
  };

  // --- ACTIONS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone || !authPassword) {
      showToast("Uzuza imyirondoro yose", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: `${authPhone}@microsofthub.app`,
        password: authPassword,
      });

      if (error) throw error;
      showToast("Wibijije neza!", "success");
    } catch (err: any) {
      showToast(err.message || "Habaye ikibazo mu kwinjira", "error");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone || !authPassword || !authName) {
      showToast("Uzuza imyirondoro yose", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: `${authPhone}@microsofthub.app`,
        password: authPassword,
        options: {
          data: {
            full_name: authName,
            phone: authPhone,
            invite_code: authInviteCode,
          },
        },
      });

      if (error) throw error;

      localStorage.setItem("mh_account_name", authName);
      localStorage.setItem("mh_account_phone", authPhone);
      setAccountName(authName);
      setAccountPhone(authPhone);

      showToast("Konti yawe yafunguwe neza!", "success");
    } catch (err: any) {
      showToast(err.message || "Habaye ikibazo mu kwiyandikisha", "error");
    }
  };

  const handleSaveAccount = () => {
    if (!accountPhone || !accountName) {
      showToast("Uzuza imyirondoro yose (Nimero n'Amazina)", "error");
      return;
    }
    localStorage.setItem("mh_account_phone", accountPhone);
    localStorage.setItem("mh_account_name", accountName);
    localStorage.setItem("mh_payment_method", paymentMethod);
    showToast("Konti yawe ihuza nimero yemejwe neza!", "success");
  };

  // Deposit Action
  const handleDepositStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Injiza umubare nyawo.", "error");
      return;
    }
    if (amt < 1000) {
      showToast("Igishoro gito ni 1,000 Frw", "error");
      return;
    }
    setDepositPhoneInput(accountPhone || "+250");
    setDepositStep("method");
  };

  const handleDepositStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositPhoneInput || depositPhoneInput.length < 9) {
      showToast("Injiza nimero ya telefone yuzuye", "error");
      return;
    }
    setDepositStep("confirm");
  };

  const handleDepositFinalize = () => {
    const amt = parseFloat(depositAmount);
    // Create pending transaction immediately
    const txId = `DEP-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTx: Transaction = {
      id: txId,
      type: "deposit",
      amount: amt,
      status: "pending",
      method: `${depositMethod} Money`,
      details: `Pending deposit of ${amt} Frw`,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    setDepositAmount("");
    setDepositStep("amount");
    setCurrentTab("account");
    setAccountTab("history");
    showToast(
      `Ubusabe bwo kubitsa ${formatFrw(amt)} bwakiriwe, buri gutunganywa (Pending).`,
      "info",
    );

    // Simulate payment received after 10 seconds
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId
            ? {
                ...tx,
                status: "success",
                details: `Successful deposit of ${amt} Frw`,
              }
            : tx,
        ),
      );
      setBalance((prev) => prev + amt);
      setTotalDeposit((prev) => prev + amt);
      showToast(
        `Wabikije ${formatFrw(amt)} neza! Konti yawe yongeweho amafaranga.`,
        "success",
      );

      // Optional: sync to Supabase if logged in
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              type: "deposit",
              amount: amt,
              status: "success",
              method: `${depositMethod} Money`,
              details: `Successful deposit of ${amt} Frw`,
            })
            .then();
          // Update profile balance (in a real app, this should be a DB trigger or RPC)
        }
      });
    }, 10000);
  };

  // Withdraw Action
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      showToast("Please enter a valid withdrawal amount.", "error");
      return;
    }
    if (amt < 1000) {
      showToast("Minimum withdrawal is 1,000 Frw.", "error");
      return;
    }
    if (amt > balance) {
      showToast(
        `Insufficient balance. You only have ${formatFrw(balance)}.`,
        "error",
      );
      return;
    }
    if (!withdrawPhone || withdrawPhone.length < 8) {
      showToast("Please enter a valid phone number.", "error");
      return;
    }

    // Immediately create pending transaction & deduct balance
    const txId = `WTH-${Math.floor(10000 + Math.random() * 90000)}`;
    const newTx: Transaction = {
      id: txId,
      type: "withdraw",
      amount: amt,
      status: "pending",
      method: `${withdrawMethod} Money`,
      details: `Pending withdrawal to ${withdrawPhone}`,
      createdAt: new Date().toISOString(),
    };

    setBalance((prev) => prev - amt);
    setTransactions((prev) => [newTx, ...prev]);
    setWithdrawAmount("");
    setCurrentTab("account");
    setAccountTab("history");
    showToast(
      `Ubusabe bwo kubikuza ${formatFrw(amt)} bwoherejwe (Pending).`,
      "info",
    );

    // Simulate completion after 10 seconds
    setTimeout(() => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === txId
            ? {
                ...tx,
                status: "success",
                details: `Withdrawal for ${withdrawPhone}`,
              }
            : tx,
        ),
      );
      setTotalWithdraw((prev) => prev + amt);
      showToast(
        `Withdrew ${formatFrw(amt)} successfully! Funds will arrive on ${withdrawPhone} soon.`,
        "success",
      );

      // Optional: sync to Supabase if logged in
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase
            .from("transactions")
            .insert({
              user_id: user.id,
              type: "withdraw",
              amount: amt,
              status: "success",
              method: `${withdrawMethod} Money`,
              details: `Withdrawal for ${withdrawPhone}`,
            })
            .then();
        }
      });
    }, 10000);
  };

  // Confirm and Execute Investment Plan
  const handleInvestConfirm = () => {
    if (!confirmingProduct) return;
    const prod = confirmingProduct;

    if (balance < prod.investmentAmount) {
      showToast(
        `Insufficient balance! This plan requires ${formatFrw(prod.investmentAmount)}. Please deposit more.`,
        "error",
      );
      setConfirmingProduct(null);
      // Redirect to deposit tab
      setCurrentTab("deposit");
      return;
    }

    // Deduct and purchase
    setBalance((prev) => prev - prod.investmentAmount);

    const newActiveInv: ActiveInvestment = {
      id: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: prod.id,
      name: prod.name,
      planName: prod.planName,
      investmentAmount: prod.investmentAmount,
      dailyIncome: prod.dailyIncome,
      purchasedAt: new Date().toISOString(),
      durationDays: prod.durationDays,
      lastClaimedAt: new Date().toISOString(),
      earningsClaimed: 0,
    };

    setActiveInvestments((prev) => [newActiveInv, ...prev]);

    const newTx: Transaction = {
      id: `TX-INV-${Math.floor(10000 + Math.random() * 90000)}`,
      type: "invest",
      amount: prod.investmentAmount,
      status: "success",
      details: `Purchased ${prod.name} (${prod.planName})`,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    setConfirmingProduct(null);
    showToast(
      `Urakoze cyane! Ushoye imari neza muri ${prod.name}! Reba ahanditse 'Konti' kugira ngo ukurikire inyungu yawe buri munsi.`,
      "success",
    );
  };

  // Claim Live simulated Profits
  const handleClaimLiveEarnings = () => {
    if (liveEarnings <= 0) {
      showToast(
        "Nta nyungu iriyongera kugeza ubu. Tegereza amasegonda make kugira ngo gahunda zawe zikore inyungu!",
        "info",
      );
      return;
    }

    const claimed = liveEarnings;
    setBalance((prev) => prev + claimed);
    setLiveEarnings(0);

    // Update active investments tracker for statistics
    setActiveInvestments((prev) =>
      prev.map((inv) => ({
        ...inv,
        earningsClaimed: inv.earningsClaimed + claimed / prev.length,
        lastClaimedAt: new Date().toISOString(),
      })),
    );

    const newTx: Transaction = {
      id: `CLM-${Math.floor(10000 + Math.random() * 90000)}`,
      type: "claim",
      amount: claimed,
      status: "success",
      details: `Claimed live profits`,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      `Ufata inyungu ya ${formatFrw(claimed)} ihita yiyongera ku mafaranga yawe ya konti!`,
      "success",
    );
  };

  // Daily Checkin Handler
  const handleDailyCheckin = () => {
    if (hasCheckedInToday) {
      showToast("Wamaze gufata inyungu yawe y'uyu munsi. Garuka ejo!", "info");
      return;
    }

    const bonus = 150;
    setBalance((prev) => prev + bonus);
    setHasCheckedInToday(true);
    localStorage.setItem("mh_last_checkin_date", new Date().toDateString());

    const newTx: Transaction = {
      id: `CHK-${Math.floor(10000 + Math.random() * 90000)}`,
      type: "claim",
      amount: bonus,
      status: "success",
      details: `Daily Check-In Bonus`,
      createdAt: new Date().toISOString(),
    };

    setTransactions((prev) => [newTx, ...prev]);
    showToast(
      "Wahawe inyungu ya 150 Frw kubera kwinjira uyu munsi!",
      "success",
    );
    setIsCheckinOpen(false);
  };

  // Lucky spin reward wheel (Rwanda investments sites always have these!)
  const handleLuckySpin = () => {
    if (balance < 500) {
      showToast(
        "Gukina ihagaze 500 Frw. Ntabwo ufite amafaranga ahagije.",
        "error",
      );
      return;
    }

    setBalance((prev) => prev - 500);
    setWheelSpinning(true);
    setWheelResult(null);

    const rewards = [
      { text: "1,000 Frw Y'Inyungu", reward: 1000 },
      { text: "250 Frw", reward: 250 },
      { text: "Gerageza n'ubutaha", reward: 0 },
      { text: "5,000 Frw JACKPOT!", reward: 5000 },
      { text: "50 Frw ya Buri Munsi", reward: 50 },
      { text: "Gabanyirizwa ibiciro kuri Surface Go", reward: 1500 },
    ];

    setTimeout(() => {
      const idx = Math.floor(Math.random() * rewards.length);
      const chosen = rewards[idx];
      setWheelSpinning(false);
      setWheelResult(chosen.text);
      if (chosen.reward > 0) {
        setBalance((prev) => prev + chosen.reward);

        const newTx: Transaction = {
          id: `SPN-${Math.floor(10000 + Math.random() * 90000)}`,
          type: "claim",
          amount: chosen.reward,
          status: "success",
          details: `Lucky Spin Reward: ${chosen.text}`,
          createdAt: new Date().toISOString(),
        };
        setTransactions((prev) => [newTx, ...prev]);
        showToast(`Utsindiye ${chosen.text}!`, "success");
      } else {
        showToast("Gerageza n'ubutaha!", "info");
      }
    }, 2500);
  };

  // Mock chat send message
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    const userMsg = supportMessage;
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", text: userMsg, time: "Just now" },
    ]);
    setSupportMessage("");

    // Simulate Agent reply
    setTimeout(() => {
      let reply =
        "Ndi gushaka ubufasha ku kibazo cyawe. Serivisi z'abakiliya zirakora. Kugira ngo deposits cyangwa withdrawals zihute, nyamuneka ba ufite ID y'igikorwa cyawe hafi.";
      if (
        userMsg.toLowerCase().includes("deposit") ||
        userMsg.toLowerCase().includes("kubitsa")
      ) {
        reply =
          "Kubitsa bikora mu buryo bwikora. Nyuma yo kohereza kuri MTN MoMo cyangwa Airtel Money, konti yawe ihita yiyongeraho ako kanya. Ubushobozi bwa make ni 1,000 Frw.";
      } else if (
        userMsg.toLowerCase().includes("withdraw") ||
        userMsg.toLowerCase().includes("kubikuza") ||
        userMsg.toLowerCase().includes("money")
      ) {
        reply =
          "Kubikuza bitwara amasaha atageze kuri 3 kuri sosiyete zose zo mu Rwanda. Ikiguzi ni 3% gusa. Haba hari ikibazo ubona kura ubu, reba neza nimero yawe yanditse.";
      } else if (
        userMsg.toLowerCase().includes("hello") ||
        userMsg.toLowerCase().includes("hi") ||
        userMsg.toLowerCase().includes("muraho")
      ) {
        reply =
          "Muraho neza! Serivisi y'abakiliya ya Microsoft Hub igutashye. Nagufasha nte guhitamo gahunda nziza yo gushora imari uyu munsi?";
      }

      setChatHistory((prev) => [
        ...prev,
        { sender: "agent", text: reply, time: "Just now" },
      ]);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
    showToast("Nimero ya konti ikopiwe!", "success");
  };

  return (
    <div
      id="app-container"
      className={`min-h-screen pb-24 transition-colors duration-300 ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      {/* Toast Overlay */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-4 left-4 right-4 z-50 flex justify-center items-center pointer-events-none"
          >
            <div
              className={`px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm border pointer-events-auto ${
                toastMessage.type === "success"
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : toastMessage.type === "error"
                    ? "bg-rose-500 border-rose-400 text-white"
                    : "bg-blue-600 border-blue-500 text-white"
              }`}
            >
              {toastMessage.type === "success" && (
                <CheckCircle className="w-5 h-5 shrink-0" />
              )}
              {toastMessage.type === "error" && (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-sm font-medium">{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isLoggedIn ? (
        <div className="flex flex-col flex-1 items-center justify-center min-h-[90vh] px-4 w-full max-w-md mx-auto relative z-10">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-[#0078D4] to-blue-500 flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
            <span className="text-3xl font-black text-white italic">M</span>
          </div>
          <h1 className="text-2xl font-extrabold font-display text-[#0078D4] dark:text-[#3397e6] tracking-tight uppercase mb-1">
            MICROSOFT HUB
          </h1>

          <div
            className={`w-full p-6 mt-8 rounded-[24px] border shadow-2xl ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100"}`}
          >
            {authView === "signin" ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Ikaze Kuri Konti Yawe
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Uzuza imyirondoro yawe kugira ngo winjire.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Nimero ya Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="Ugero: 078..."
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className={`w-full p-3.5 rounded-xl font-bold text-sm outline-none border focus:border-[#0078D4] ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Ijambo ry'Ibanga (Password)
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className={`w-full p-3.5 rounded-xl font-bold text-sm outline-none border focus:border-[#0078D4] ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-500 hover:from-blue-600 hover:to-blue-500 active:scale-[0.99] transition shadow-lg text-white font-bold text-sm tracking-wide mt-4"
                >
                  KWINJIRA (SIGN IN)
                </button>

                <p className="text-center text-xs text-slate-500 mt-2">
                  Nta konti ufite?{" "}
                  <span
                    onClick={() => setAuthView("signup")}
                    className="text-[#0078D4] font-bold cursor-pointer hover:underline"
                  >
                    Iyandikishe nonaha
                  </span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    Fungura Konti Nshya
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Tangira gushora imari wunguke buri munsi.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Amazina Yawe
                  </label>
                  <input
                    type="text"
                    placeholder="Ugero: John Doe"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className={`w-full p-3.5 rounded-xl font-bold text-sm outline-none border focus:border-[#0078D4] ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Nimero ya Telefone
                  </label>
                  <input
                    type="tel"
                    placeholder="Ugero: 078..."
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className={`w-full p-3.5 rounded-xl font-bold text-sm outline-none border focus:border-[#0078D4] ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Ijambo ry'Ibanga
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className={`w-full p-3.5 rounded-xl font-bold text-sm outline-none border focus:border-[#0078D4] ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Referral Code (Kode Yabatumiyemo)
                  </label>
                  <input
                    type="text"
                    placeholder="Niba ihari"
                    value={authInviteCode}
                    onChange={(e) => setAuthInviteCode(e.target.value)}
                    className={`w-full p-3.5 rounded-xl font-bold text-sm outline-none border focus:border-[#0078D4] ${darkMode ? "bg-slate-950 border-slate-800 text-slate-100" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 active:scale-[0.99] transition shadow-lg text-white font-bold text-sm tracking-wide mt-4"
                >
                  KWİYANDIKISHA (SIGN UP)
                </button>

                <p className="text-center text-xs text-slate-500 mt-2">
                  Usanzwe ufite konti?{" "}
                  <span
                    onClick={() => setAuthView("signin")}
                    className="text-[#0078D4] font-bold cursor-pointer hover:underline"
                  >
                    Injira hano
                  </span>
                </p>
              </form>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Microsoft Hub. All rights
              reserved.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Title Header with Dark Mode Toggle */}
          <header
            id="main-header"
            className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 py-3.5 flex justify-between items-center transition-colors ${darkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-slate-100"}`}
          >
            <div className="w-10"></div>
            <h1 className="text-xl font-extrabold font-display text-[#0078D4] dark:text-[#3397e6] tracking-tight uppercase">
              MICROSOFT HUB
            </h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl transition-all ${darkMode ? "bg-slate-800 text-amber-400 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
          </header>

          {/* Scrolling Ticker / Live Events */}
          <section
            id="announcement-bar"
            className={`py-2 px-4 text-xs font-medium border-b flex items-center overflow-hidden h-9 transition-colors ${darkMode ? "bg-slate-900 border-slate-800/80 text-blue-400" : "bg-sky-50/50 border-sky-100 text-[#0078D4]"}`}
          >
            <div className="flex items-center gap-1.5 shrink-0 uppercase tracking-widest text-[9px] px-2 py-0.5 rounded-full bg-[#0078D4]/10 mr-2 text-[#0078D4] dark:text-[#3397e6] font-bold">
              <Zap className="w-3 h-3 fill-current" /> Live
            </div>
            <div className="relative w-full h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={tickerIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center font-mono truncate"
                >
                  {mockTickerMessages[tickerIndex]}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* Main Container */}
          <main className="max-w-md mx-auto px-4 pt-4 pb-8 flex flex-col gap-4">
            {/* STATS CARD */}
            <section
              id="statistics-card"
              className="grid grid-cols-3 gap-3 md:gap-4"
            >
              <button
                type="button"
                onClick={() => copyToClipboard("MH20250001")}
                className={`p-3.5 rounded-[20px] border flex flex-col justify-center items-start text-left cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 shadow-slate-950/20 shadow-md hover:border-[#0078D4]/40"
                    : "bg-white border-slate-200/60 shadow-sm hover:border-[#0078D4]/30"
                }`}
              >
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  Nimero ya Konti
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 flex items-center gap-1 font-mono">
                  MH20250001{" "}
                  <Copy className="w-3 h-3 text-[#0078D4] shrink-0" />
                </span>
              </button>

              <div
                className={`p-3.5 rounded-[20px] border flex flex-col justify-center items-start ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 shadow-slate-950/20 shadow-md"
                    : "bg-white border-slate-200/60 shadow-sm"
                }`}
              >
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  Amafaranga Yose Yabikijwe
                </span>
                <span className="text-xs font-bold text-[#0078D4] dark:text-sky-450 mt-1 font-mono">
                  {formatFrw(totalDeposit)}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-[20px] border flex flex-col justify-center items-start ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 shadow-slate-950/20 shadow-md"
                    : "bg-white border-slate-200/60 shadow-sm"
                }`}
              >
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                  Amafaranga Yose Yakuwemo
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 font-mono">
                  {formatFrw(totalWithdraw)}
                </span>
              </div>
            </section>

            {/* BALANCE CARD (Blue Gradient Backdrop) */}
            <section id="balance-section" className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-[#0078D4] rounded-[24px] blur-md opacity-20 group-hover:opacity-35 transition duration-300"></div>
              <div className="relative rounded-[20px] bg-gradient-to-br from-[#0078D4] to-[#005a9e] p-6 lg:p-8 text-white shadow-xl overflow-hidden">
                {/* Visual patterns */}
                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                <div className="absolute -left-6 -top-6 w-24 h-24 bg-[#00B7F1]/10 rounded-full blur-xl"></div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs uppercase font-extrabold tracking-widest text-blue-100/90 mb-1 flex items-center gap-1.5">
                      <Wallet className="w-4 h-4 shrink-0" /> Amafaranga Ari
                      Kuri Konti
                    </p>
                    <div className="text-4xl font-extrabold tracking-tight font-display my-1">
                      {formatFrw(balance)}
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* Amafaranga Yashowe */}
                <div className="mt-4 pt-4 border-t border-white/15 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-blue-100/80 tracking-widest">
                      Amafaranga Yashowe
                    </p>
                    <p className="text-lg font-bold font-mono mt-0.5">
                      {formatFrw(
                        activeInvestments.reduce(
                          (sum, current) => sum + current.investmentAmount,
                          0,
                        ),
                      )}
                    </p>
                  </div>
                </div>

                {/* Quick action shortcuts matching design guidelines */}
                <div className="mt-6 grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setCurrentTab("deposit")}
                    className="py-2.5 rounded-full bg-white text-[#0078D4] hover:bg-slate-50 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowUpCircle className="w-4 h-4" /> Kubitsa
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentTab("withdraw")}
                    className="py-2.5 rounded-full bg-[#00B7F1] hover:bg-[#0096c7] text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <ArrowDownCircle className="w-4 h-4" /> Kubikuza
                  </button>
                </div>
              </div>
            </section>

            {/* MOCK SHORTCUT ICONS BAR (Referencing Image 2 icons setup) */}
            {currentTab === "home" && (
              <section
                id="quick-actions-grid"
                className="grid grid-cols-5 gap-1 py-2"
              >
                <button
                  onClick={() => setIsCheckinOpen(true)}
                  className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-blue-500/5 transition relative"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition">
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight">
                    Inyungu y'Umunsi
                  </span>
                  {!hasCheckedInToday && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>
                  )}
                  {!hasCheckedInToday && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full"></span>
                  )}
                </button>

                <button
                  onClick={() => setIsSupportOpen(true)}
                  className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-blue-500/5 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight">
                    Ubufasha
                  </span>
                </button>

                <button
                  onClick={() => {
                    showToast(
                      "Icyemezo cy'ishoramari cya Microsoft Hub cyemejwe ku mugaragaro na Minisiteri y'Ikoranabuhanga n'Isakazabumenyi (Ministry of ICT).",
                      "success",
                    );
                  }}
                  className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-blue-500/5 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 flex items-center justify-center transition">
                    <Award className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight">
                    Icyemezo
                  </span>
                </button>

                <button
                  onClick={() => setIsLuckyWheelOpen(true)}
                  className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-blue-500/5 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 flex items-center justify-center transition animate-bounce">
                    <Gift className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight">
                    Amahirwe
                  </span>
                </button>

                <button
                  onClick={() => setCurrentTab("invite")}
                  className="flex flex-col items-center gap-1.5 p-1 rounded-2xl hover:bg-blue-500/5 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 flex items-center justify-center transition">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center leading-tight">
                    Gutumira
                  </span>
                </button>
              </section>
            )}

            {/* MAIN VIEWS SWITCHER */}
            <div id="tab-views">
              {/* 1. HOME VIEW */}
              {currentTab === "home" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  {/* LUCKY WHEEL ENTRY BANNER */}
                  <div
                    onClick={() => setIsLuckyWheelOpen(true)}
                    className="relative rounded-[20px] bg-gradient-to-r from-amber-500 via-orange-600 to-red-500 p-4 text-white shadow-md overflow-hidden cursor-pointer hover:brightness-105 transition"
                  >
                    <div className="absolute right-2 -bottom-2 opacity-15">
                      <Gift className="w-24 h-24" />
                    </div>
                    <div className="max-w-[70%]">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                        UMUKINO W'AMAHIRWE
                      </span>
                      <h3 className="text-base font-extrabold mt-1 tracking-tight">
                        KINA ITORA RY'AMAHIRWE
                      </h3>
                      <p className="text-xs text-white/90 mt-0.5">
                        Zungurusa uruziga rw'amahirwe rwa Microsoft utsindire
                        ibihembo bitandukanye kugeza ku 5,000 Frw!
                      </p>
                    </div>
                  </div>

                  {/* INTEGRITY PROMISE BANNER */}
                  <div
                    className={`rounded-[20px] p-4 border flex items-start gap-3 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-[#0078D4]/5 border-blue-100"}`}
                  >
                    <ShieldCheck className="w-5 h-5 text-[#0078D4] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#0078D4] dark:text-[#3397e6] uppercase tracking-wide">
                        Ubwiyemezi n'Umutekano
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Bihagarariwe n'Urwego rushinzwe Umutekano
                        n'Ikoranabuhanga (Ministry of ICT). Ishoramari ryose
                        ririzewe 100% riranditswe bikurinda igihombo. Bona
                        inyungu ishimishije ya buri munsi mu gihe cy'iminsi 30
                        mu mutekano.
                      </p>
                    </div>
                  </div>

                  {/* QUICK PRODUCT PREVIEW */}
                  <div className="flex justify-between items-center mt-2">
                    <h3 className="text-[#0078D4] dark:text-[#3397e6] text-sm font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4" /> Ibicuruzwa Byo Gushoramo
                    </h3>
                    <button
                      onClick={() => setCurrentTab("invest")}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center"
                    >
                      Ibyereke byose <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Show all 7 products */}
                  <div
                    id="featured-products-container"
                    className="flex flex-col gap-3"
                  >
                    {products.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onInvest={(p) => setConfirmingProduct(p)}
                        formatFrw={formatFrw}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 2. DEPOSIT VIEW */}
              {currentTab === "deposit" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div
                    className={`p-4 rounded-[20px] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                  >
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <ArrowUpCircle className="w-5 h-5 text-emerald-500" />{" "}
                      Kubitsa (MoMo n'Airtel)
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Shyira amafaranga kuri konti yawe nonaha ukoresheje MTN
                      Mobile Money cyangwa Airtel Money.
                    </p>

                    {depositStep === "amount" && (
                      <form
                        onSubmit={handleDepositStep1}
                        className="flex flex-col gap-4"
                      >
                        {/* AMOUNT INPUT */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-400 uppercase">
                            Amafaranga Ushaka Kubitsa (Frw)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="Ugereranyije: 15,000"
                              value={depositAmount}
                              onChange={(e) => setDepositAmount(e.target.value)}
                              className={`w-full p-3 rounded-xl font-bold font-mono outline-none text-lg border ${
                                darkMode
                                  ? "bg-slate-950 border-slate-800 text-white focus:border-[#0078D4]"
                                  : "bg-slate-50 border-slate-100 text-[#0078D4] focus:border-[#0078D4]"
                              }`}
                              required
                            />
                            <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">
                              Frw
                            </span>
                          </div>
                        </div>

                        {/* PRESETS */}
                        <div className="flex flex-col gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Cyangwa se hitamo umubare w'igishoro
                          </span>
                          <div className="grid grid-cols-4 gap-1.5 text-xs">
                            {[
                              6000, 15000, 35000, 60000, 90000, 150000, 200000,
                            ].map((amt) => (
                              <button
                                key={amt}
                                type="button"
                                onClick={() => setDepositAmount(amt.toString())}
                                className={`py-2 rounded-lg font-bold font-mono border transition ${
                                  depositAmount === amt.toString()
                                    ? "bg-[#0078D4] text-white border-blue-500 shadow-md shadow-blue-500/10"
                                    : darkMode
                                      ? "bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900"
                                      : "bg-slate-100 border-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                              >
                                {amt >= 1000 ? `${amt / 1000}k` : amt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-4 rounded-xl bg-gradient-to-r from-[#0078D4] to-blue-500 hover:from-blue-600 hover:to-blue-500 active:scale-[0.99] transition shadow-lg text-white font-bold text-sm tracking-wide mt-2"
                        >
                          KUBITSA{" "}
                          {depositAmount
                            ? `${formatFrw(parseFloat(depositAmount) || 0)}`
                            : ""}{" "}
                          NONAHA
                        </button>
                      </form>
                    )}

                    {depositStep === "method" && (
                      <form
                        onSubmit={handleDepositStep2}
                        className="flex flex-col gap-4"
                      >
                        <button
                          type="button"
                          onClick={() => setDepositStep("amount")}
                          className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 w-fit"
                        >
                          <RotateCcw className="w-3 h-3" /> Subira Inyuma
                        </button>

                        <div className="text-center">
                          <div className="w-12 h-12 bg-[#0078D4] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-[0_4px_16px_rgba(0,120,212,0.3)]">
                            <span className="text-xl font-black text-white italic">
                              P
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 px-2 tracking-wide font-medium">
                            Please fill in your payment method and the actual
                            payment account you will use to make the payment.
                          </p>
                          <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Payment Amount:{" "}
                            <span className="text-amber-500">
                              RWF {parseFloat(depositAmount) || 0}
                            </span>
                          </div>
                        </div>

                        {/* GATEWAY SELECTOR */}
                        <div className="flex flex-col gap-2 mt-2">
                          <label className="text-xs text-slate-500 dark:text-slate-400">
                            Please select a payment method
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setDepositMethod("MTN")}
                              className={`p-3.5 rounded-[16px] border flex items-center justify-center gap-1.5 transition relative overflow-hidden ${
                                depositMethod === "MTN"
                                  ? "bg-transparent border-[#ffcc00] shadow-[0_0_0_1px_#ffcc00]"
                                  : darkMode
                                    ? "bg-slate-950 border-slate-800 text-slate-500"
                                    : "bg-white border-slate-200 text-slate-600"
                              }`}
                            >
                              <div className="w-6 h-6 rounded bg-[#ffcc00] flex items-center justify-center font-black text-[#004f71] text-[9px]">
                                MTN
                              </div>
                              <span className="font-bold text-xs">MTN</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setDepositMethod("Airtel")}
                              className={`p-3.5 rounded-[16px] border flex items-center justify-center gap-1.5 transition relative overflow-hidden ${
                                depositMethod === "Airtel"
                                  ? "bg-transparent border-[#ff0000] shadow-[0_0_0_1px_#ff0000]"
                                  : darkMode
                                    ? "bg-slate-950 border-slate-800 text-slate-500"
                                    : "bg-white border-slate-200 text-slate-600"
                              }`}
                            >
                              <div className="w-6 h-6 rounded bg-[#ff0000] flex items-center justify-center font-black text-white text-[9px]">
                                Airtel
                              </div>
                              <span className="font-bold text-xs font-mono">
                                AIRTEL
                              </span>
                            </button>
                          </div>
                        </div>

                        <div
                          className={`mt-2 rounded-xl border flex items-center overflow-hidden focus-within:ring-1 focus-within:ring-[#0078D4] ${darkMode ? "bg-slate-950 border-slate-800 focus-within:border-[#0078D4]" : "bg-white border-slate-200 focus-within:border-[#0078D4]"}`}
                        >
                          <div className="pl-3 pr-2 py-3 text-amber-600 font-bold text-sm bg-transparent border-r border-slate-200 dark:border-slate-800">
                            +250
                          </div>
                          <input
                            type="tel"
                            value={depositPhoneInput.replace(/^\+250/, "")}
                            onChange={(e) =>
                              setDepositPhoneInput("+250" + e.target.value)
                            }
                            placeholder="Please enter your actual payment account"
                            className="w-full py-3 px-3 outline-none bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 placeholder:font-normal placeholder-slate-400/80"
                          />
                        </div>

                        <div className="flex gap-2 items-start p-3 bg-rose-50/50 dark:bg-rose-500/5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <span className="text-rose-500 font-black text-xs shrink-0 mt-0.5">
                            !
                          </span>
                          <p className="text-[11px] text-rose-500 leading-tight">
                            Please fill in your payment account accurately,
                            incorrect filling may result in the loss of the
                            transferred funds.
                          </p>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 active:scale-[0.99] transition shadow-md shadow-amber-500/20 text-white font-bold text-sm tracking-wide mt-2 flex justify-center items-center gap-1"
                        >
                          Confirm <ChevronRight className="w-4 h-4" />
                        </button>
                      </form>
                    )}

                    {depositStep === "confirm" && (
                      <>
                        <div className="flex flex-col gap-0 border-l border-dashed border-slate-300 dark:border-slate-700 ml-4 relative pb-4">
                          <button
                            type="button"
                            onClick={() => setDepositStep("method")}
                            className="absolute -left-[4.5rem] top-0 text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 w-fit"
                          >
                            <RotateCcw className="w-3 h-3" /> Back
                          </button>

                          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 border-4 border-white dark:border-slate-900">
                            <Layers className="w-3 h-3" />
                          </div>

                          <div className="pl-6 pt-1">
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-1.5">
                              Copy & Pay
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                              Copy this{" "}
                              <span
                                className={
                                  depositMethod === "MTN"
                                    ? "text-amber-500 font-bold"
                                    : "text-rose-500 font-bold"
                                }
                              >
                                {depositMethod}
                              </span>{" "}
                              account and make payment
                            </p>

                            <div
                              className={`p-4 rounded-[16px] bg-slate-50 dark:bg-slate-900/50 mb-4 flex flex-col gap-4 border border-slate-100 dark:border-slate-800`}
                            >
                              <div>
                                <p className="text-[#a0aab5] text-xs font-medium mb-1">
                                  Total Amount:
                                </p>
                                <p className="text-xl font-semibold text-amber-500">
                                  RWF{" "}
                                  <span className="text-2xl font-bold">
                                    {parseFloat(depositAmount) || 0}
                                  </span>
                                </p>
                              </div>

                              <div>
                                <p className="text-[#a0aab5] text-xs font-medium mb-1">
                                  {depositMethod} Account:
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xl font-medium text-amber-500">
                                    0798107360
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        "0798107360",
                                      );
                                      showToast("Account copied!");
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600"
                                  >
                                    <Copy className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>

                              <div>
                                <p className="text-[#a0aab5] text-xs font-medium mb-1">
                                  Account Name:
                                </p>
                                <div className="flex items-center justify-between">
                                  <p className="text-xl font-medium text-amber-500 capitalize">
                                    gaspard baziki
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        "gaspard baziki",
                                      );
                                      showToast("Name copied!");
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-slate-600"
                                  >
                                    <Copy className="w-5 h-5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                showToast("Turimo kwemeza ubwishyu...", "info");
                                setTimeout(() => {
                                  handleDepositFinalize();
                                }, 3000);
                              }}
                              className="w-full py-3.5 rounded-full bg-[#f28b03] hover:bg-[#e07a00] active:scale-[0.99] transition shadow-md shadow-amber-500/10 text-white font-bold text-sm tracking-wide"
                            >
                              Click to pay
                            </button>

                            <div className="flex justify-center mt-3">
                              <button
                                onClick={() => {
                                  const code =
                                    depositMethod === "MTN"
                                      ? `*182*1*1*0798107360*${parseFloat(depositAmount) || 0}#`
                                      : `*182*1*1*0798107360*${parseFloat(depositAmount) || 0}#`;
                                  navigator.clipboard.writeText(code);
                                  showToast("USSD Code copied!");
                                }}
                                className="text-amber-500 font-bold text-xs flex items-center gap-1.5 hover:underline"
                              >
                                {depositMethod === "MTN"
                                  ? `*182*1*1*0798107360*${parseFloat(depositAmount) || 0}#`
                                  : `*182*1*1*0798107360*${parseFloat(depositAmount) || 0}#`}
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0 border-l border-dashed border-slate-300 dark:border-slate-700 ml-4 relative pb-4">
                          <div className="absolute -left-3 top-2 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 border-4 border-white dark:border-slate-900">
                            <RotateCcw className="w-3 h-3" />
                          </div>

                          <div className="pl-6 pt-3">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Payment completed?
                            </h4>
                            <p className="text-[11px] text-slate-400 mb-3">
                              Click{" "}
                              <span className="text-rose-500 font-bold">
                                "Refresh"
                              </span>{" "}
                              to check if it is successful
                            </p>

                            <div
                              className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-2 border border-slate-100 dark:border-slate-800 mb-6`}
                            >
                              <p className="text-slate-700 dark:text-slate-300 text-sm font-bold">
                                Amount paid:
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-xl font-bold text-slate-300 dark:text-slate-600">
                                  RWF 0
                                </p>
                                <button
                                  onClick={() => {
                                    showToast(
                                      "Checking payment status...",
                                      "info",
                                    );
                                    setTimeout(() => {
                                      handleDepositFinalize();
                                    }, 2000);
                                  }}
                                  className="bg-[#f28b03] text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-amber-600"
                                >
                                  Refresh
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2">
                                The payment is expected to be successful in 2-10
                                minutes. Click to refresh the results.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-0 ml-4 relative">
                          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 border-4 border-white dark:border-slate-900">
                            <User className="w-3 h-3" />
                          </div>

                          <div className="pl-6">
                            <p className="text-[13px] text-slate-600 dark:text-slate-400 font-medium">
                              Your payment account:
                            </p>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1">
                              {depositPhoneInput || accountPhone}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* RECENT DEPOSIT TRANSACTIONS inside deposit screen */}
                  <div
                    className={`p-4 rounded-[20px] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                  >
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                      Amabwiriza yo Kubitsa
                    </h4>
                    <ol className="text-xs text-slate-500 dark:text-slate-400 list-decimal pl-4 flex flex-col gap-2 leading-relaxed">
                      <li>Hitamo igishoro ushaka kubitsa cyangwa ucyandike.</li>
                      <li>
                        Kanda kuri 'KUBITSA' kugira ngo utangire gukora
                        ishoramari ryawe.
                      </li>
                      <li>
                        Shyiramo umubare w'ibanga (PIN) wa Mobile Money kugira
                        ngo wemeze kubitsa.
                      </li>
                      <li>
                        Tegereza umunota 1 cyangwa 2 kugira ngo konti yawe ihite
                        yiyongera.
                      </li>
                    </ol>
                  </div>
                </motion.div>
              )}

              {/* 3. INVEST VIEW */}
              {currentTab === "invest" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-3"
                >
                  <div className="p-1">
                    <h3 className="text-lg font-bold font-display text-slate-800 dark:text-white">
                      Ibicuruzwa Byo Gushoramo
                    </h3>
                    <p className="text-xs text-slate-400">
                      Gahunda ishingiye ku ishoramari rya buri munsi mu gihe
                      cy'iminsi 30 icunzwe neza.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {products.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onInvest={(p) => setConfirmingProduct(p)}
                        formatFrw={formatFrw}
                        darkMode={darkMode}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 4. WITHDRAW VIEW */}
              {currentTab === "withdraw" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div
                    className={`p-4 rounded-[20px] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                  >
                    <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                      <ArrowDownCircle className="w-5 h-5 text-rose-500" />{" "}
                      Kubikuza Amafaranga
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Bona inyungu yawe nonaha ukayohereza kuri konti yawe ya
                      Mobile Wallet.
                    </p>

                    <form
                      onSubmit={handleWithdraw}
                      className="flex flex-col gap-4"
                    >
                      {/* CURRENT BALANCE RETRIEVER */}
                      <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-500">
                          Amafaranga ushobora kubikuza:
                        </span>
                        <span className="font-bold text-orange-500 font-mono text-sm">
                          {formatFrw(balance)}
                        </span>
                      </div>

                      {/* WITHDRAW AMOUNT */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                          Amafaranga Ushaka Kubikuza
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Kugera kuri: 1,000 Frw"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            className={`w-full p-3 rounded-xl font-bold font-mono outline-none text-base border ${
                              darkMode
                                ? "bg-slate-950 border-slate-800 text-white focus:border-[#0078D4]"
                                : "bg-slate-50 border-slate-100 text-[#0078D4] focus:border-[#0078D4]"
                            }`}
                            required
                          />
                          <span className="absolute right-3 top-3.5 text-xs font-bold text-slate-400">
                            Frw
                          </span>
                        </div>
                      </div>

                      {/* INPUT MOMO PHONE NUMBER */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase font-sans">
                          Nimero ya MoMo/Airtel Yanditse
                        </label>
                        <input
                          type="tel"
                          placeholder="Ugereranyije: 078XXXXXXX"
                          value={withdrawPhone}
                          onChange={(e) => setWithdrawPhone(e.target.value)}
                          className={`w-full p-3 rounded-xl font-mono outline-none border ${
                            darkMode
                              ? "bg-slate-950 border-slate-800 text-white focus:border-[#0078D4]"
                              : "bg-slate-50 border-slate-100 text-[#0078D4] focus:border-[#0078D4]"
                          }`}
                          required
                        />
                      </div>

                      {/* PROVIDER SELECT */}
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          Sosiyete ya terefone
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setWithdrawMethod("MTN")}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              withdrawMethod === "MTN"
                                ? "bg-amber-500/10 border-amber-500 text-amber-500"
                                : darkMode
                                  ? "bg-slate-950 border-slate-800 text-slate-500"
                                  : "bg-slate-100 border-slate-100 text-slate-600"
                            }`}
                          >
                            MTN Mobile Money
                          </button>
                          <button
                            type="button"
                            onClick={() => setWithdrawMethod("Airtel")}
                            className={`py-2 rounded-xl text-xs font-bold border transition ${
                              withdrawMethod === "Airtel"
                                ? "bg-rose-500/10 border-rose-500 text-rose-500"
                                : darkMode
                                  ? "bg-slate-950 border-slate-800 text-slate-500"
                                  : "bg-slate-100 border-slate-100 text-slate-600"
                            }`}
                          >
                            Airtel Money
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        ⚠️ <span className="font-bold">Icyitonderwa:</span> Hari
                        ikiguzi cya 3% cyo kohereza. Kubikuza bitwara amasaha
                        ari hagati ya 3 na 6. Reba neza nimero yawe kugira ngo
                        ukumire ikibazo cyo gufunga konti.
                      </p>

                      <button
                        type="submit"
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-500 hover:to-orange-400 active:scale-[0.99] transition shadow-lg text-white font-bold text-sm tracking-wide mt-1"
                      >
                        EMEZA KUBIKUZA
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* 5. ACCOUNT VIEW */}
              {currentTab === "account" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div
                    className={`p-4 rounded-[20px] border flex items-center gap-3.5 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                  >
                    <div className="w-14 h-14 rounded-full bg-[#0078D4] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
                      MH
                    </div>
                    <div>
                      <h3 className="text-base font-bold font-display">
                        Umushoramari MH20250001
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold mt-0.5">
                        <ShieldCheck className="w-4 h-4" /> Umushoramari Wemerwe
                        (Platinum)
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Umunyamuryango kuva: MH-2025
                      </span>
                    </div>
                  </div>

                  {/* ACCOUNT NAVIGATION TOGGLE */}
                  <div
                    className={`flex p-1 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                  >
                    <button
                      onClick={() => setAccountTab("overview")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                        accountTab === "overview"
                          ? "bg-[#0078D4] text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      Konti Yanjye
                    </button>
                    <button
                      onClick={() => setAccountTab("history")}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                        accountTab === "history"
                          ? "bg-[#0078D4] text-white shadow-md"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      History (Amateka)
                    </button>
                  </div>

                  {accountTab === "overview" && (
                    <>
                      <div
                        className={`p-4 rounded-[20px] border mb-3 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                            Umwirondoro
                          </h4>
                          <button
                            onClick={async () => {
                              await supabase.auth.signOut();
                              showToast("Wasohotse neza", "info");
                            }}
                            className="text-[10px] font-bold text-rose-500 hover:bg-rose-500/10 px-2 py-1 rounded"
                          >
                            Sohoka (Logout)
                          </button>
                        </div>
                      </div>

                      {/* LINK ACCOUNT FORM (Guhuza na Konti) */}
                      <div
                        className={`p-4 rounded-[20px] border mb-3 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                      >
                        <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3">
                          Guhuza na Konti
                        </h4>

                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setPaymentMethod("mtn")}
                              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-[11px] font-bold transition ${
                                paymentMethod === "mtn"
                                  ? "bg-[#ffcc00]/10 border-[#ffcc00] text-[#ffcc00]"
                                  : "border-slate-200 dark:border-slate-800 text-slate-500"
                              }`}
                            >
                              <div className="w-3 h-3 rounded-full bg-[#ffcc00]" />{" "}
                              Mobile Money
                            </button>
                            <button
                              onClick={() => setPaymentMethod("airtel")}
                              className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-[11px] font-bold transition ${
                                paymentMethod === "airtel"
                                  ? "bg-[#ff0000]/10 border-[#ff0000] text-[#ff0000]"
                                  : "border-slate-200 dark:border-slate-800 text-slate-500"
                              }`}
                            >
                              <div className="w-3 h-3 rounded-full bg-[#ff0000]" />{" "}
                              Airtel Money
                            </button>
                          </div>

                          <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            placeholder="Amazina (Name on Mobile)"
                            className={`w-full py-2.5 px-4 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-[#0078D4] ${
                              darkMode
                                ? "bg-slate-950/50 border-slate-800 text-slate-200 placeholder-slate-600"
                                : "bg-slate-50 border-slate-200 placeholder-slate-400"
                            }`}
                          />

                          <input
                            type="text"
                            value={accountPhone}
                            onChange={(e) => setAccountPhone(e.target.value)}
                            placeholder="Nimero ya Telefone"
                            className={`w-full py-2.5 px-4 rounded-xl border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#0078D4] ${
                              darkMode
                                ? "bg-slate-950/50 border-slate-800 text-slate-200 placeholder-slate-600"
                                : "bg-slate-50 border-slate-200 placeholder-slate-400"
                            }`}
                          />

                          <button
                            onClick={handleSaveAccount}
                            className="w-full py-2.5 rounded-xl bg-[#0078D4] hover:bg-blue-600 active:scale-[0.98] transition-all text-white font-bold text-xs shadow-md mt-1"
                          >
                            Kubika (Save)
                          </button>
                        </div>
                      </div>

                      {/* INVESTMENT SUMMARY STATS */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div
                          className={`p-3 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Gahunda Zikora
                          </span>
                          <span className="text-lg font-extrabold text-[#0078D4] dark:text-[#3397e6]">
                            {activeInvestments.length}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                        >
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Inyungu Yose Muri rusange
                          </span>
                          <span className="text-lg font-extrabold text-emerald-500">
                            +
                            {formatFrw(
                              activeInvestments.reduce(
                                (sum, current) => sum + current.earningsClaimed,
                                0,
                              ),
                            )}
                          </span>
                        </div>
                      </div>

                      {/* LIST OF ACTIVE INVESTMENTS */}
                      <div
                        className={`p-4 rounded-[20px] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                            Ishoramari Ryanje ({activeInvestments.length})
                          </h4>
                          <button
                            onClick={handleClaimLiveEarnings}
                            className="text-[10px] font-bold text-[#0078D4] hover:underline flex items-center gap-0.5"
                          >
                            Fata Inyungu Nyayo <RotateCcw className="w-3 h-3" />
                          </button>
                        </div>

                        {activeInvestments.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                            <Layers className="w-8 h-8 text-slate-600/40" />
                            Nta gishoro urakora kugeza ubu. Kanda kuri{" "}
                            <span
                              onClick={() => setCurrentTab("invest")}
                              className="text-blue-500 font-extrabold underline cursor-pointer"
                            >
                              Gushora Imari
                            </span>{" "}
                            utangire kugenera inyungu ya buri munsi!
                          </div>
                        ) : (
                          <div className="flex flex-col gap-3">
                            {activeInvestments.map((inv) => (
                              <div
                                key={inv.id}
                                className="p-3 rounded-xl bg-slate-950/20 border border-slate-800 flex flex-col gap-2"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold text-[#0078D4]">
                                    {inv.name}
                                  </span>
                                  <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-[#0078D4]/10 text-[#0078D4]">
                                    {inv.planName}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 text-[11px] text-slate-400">
                                  <div>
                                    Igishoro Cyashowe:{" "}
                                    <span className="font-bold text-slate-300 font-mono">
                                      {formatFrw(inv.investmentAmount)}
                                    </span>
                                  </div>
                                  <div>
                                    Inyungu Ku Munsi:{" "}
                                    <span className="font-bold text-emerald-500 font-mono">
                                      +{formatFrw(inv.dailyIncome)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center pt-2 border-t border-slate-800/60 text-[10px]">
                                  <span className="text-slate-500">
                                    Iminsi ishize: 1 / {inv.durationDays} Iminsi
                                  </span>
                                  <span className="text-[#0078D4] font-medium">
                                    Kwiyongera...
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {accountTab === "history" && (
                    <div
                      className={`p-4 rounded-[20px] border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}
                    >
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2.5">
                        Amateka y'Ibikorwa
                      </h4>

                      {transactions.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">
                          Nta bikorwa biheruka kuri konti yawe.
                        </p>
                      ) : (
                        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
                          {transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 dark:border-slate-800 last:border-b-0"
                            >
                              <div>
                                <div className="font-bold text-slate-300 capitalize">
                                  {tx.type === "deposit"
                                    ? "Kubitsa (MoMo)"
                                    : tx.type === "withdraw"
                                      ? "Kubikuza"
                                      : tx.type === "claim"
                                        ? "Inyungu"
                                        : tx.type === "invest"
                                          ? "Ishoramari"
                                          : tx.type}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {new Date(tx.createdAt).toLocaleDateString()}{" "}
                                  {new Date(tx.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`font-mono font-bold ${
                                    tx.type === "deposit" || tx.type === "claim"
                                      ? "text-emerald-500"
                                      : "text-rose-500"
                                  }`}
                                >
                                  {tx.type === "deposit" || tx.type === "claim"
                                    ? "+"
                                    : "-"}
                                  {formatFrw(tx.amount)}
                                </div>
                                <span
                                  className={`text-[9px] uppercase tracking-wider font-bold ${tx.status === "success" ? "text-emerald-500" : "text-amber-500"}`}
                                >
                                  {tx.status === "success"
                                    ? "YEMEWE"
                                    : "ITEGEREJWE"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* 6. INVITE (REFERRAL) VIEW */}
              {currentTab === "invite" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  <div
                    className={`p-5 rounded-[20px] border relative overflow-hidden ${darkMode ? "bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-900/50" : "bg-gradient-to-br from-indigo-50 to-white border-indigo-100"}`}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Sparkles className="w-24 h-24 text-indigo-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10">
                      <Sparkles className="w-5 h-5 text-indigo-500" /> Gutumira
                      Incuti
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 relative z-10">
                      Kopera iyi link wohereze incuti zawe. Ubona inyungu iyo
                      bakoze ishoramari binyuze kuri link yawe.
                    </p>

                    <div className="flex items-center gap-2 mb-6 relative z-10">
                      <div
                        className={`flex-1 p-3 rounded-xl font-mono text-xs border ${darkMode ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-600"} truncate select-all`}
                      >
                        https://micro-hub.rw/register?ref=MH20250001
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            "https://micro-hub.rw/register?ref=MH20250001",
                          );
                          showToast("Link y'ubutumire ikopiwe!", "success");
                        }}
                        className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-md shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-col gap-3 relative z-10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Inyungu mu Byiciro
                      </h4>

                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                            1
                          </div>
                          <div>
                            <div className="text-xs font-bold">
                              Incuti zawe (Level 1)
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Inyungu ya{" "}
                              <span className="font-bold text-emerald-500">
                                30%
                              </span>{" "}
                              ku gishoro
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono">0</div>
                          <div className="text-[9px] uppercase text-slate-400">
                            Abanyamuryango
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                            2
                          </div>
                          <div>
                            <div className="text-xs font-bold">
                              Incuti zabo (Level B)
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Inyungu ya{" "}
                              <span className="font-bold text-blue-500">
                                15%
                              </span>{" "}
                              ku gishoro
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono">0</div>
                          <div className="text-[9px] uppercase text-slate-400">
                            Abanyamuryango
                          </div>
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-100"}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                            3
                          </div>
                          <div>
                            <div className="text-xs font-bold">
                              Ijyera kure (Level C)
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Inyungu ya{" "}
                              <span className="font-bold text-amber-500">
                                4%
                              </span>{" "}
                              ku gishoro
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black font-mono">0</div>
                          <div className="text-[9px] uppercase text-slate-400">
                            Abanyamuryango
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="mt-8 mb-4 text-center pb-8">
              <p className="text-[10px] text-slate-500 font-medium">
                &copy; {new Date().getFullYear()} Microsoft Hub. All rights
                reserved.
              </p>
            </div>
          </main>

          {/* --- BOTTOM MOBILE-FIRST NAVIGATION BAR --- */}
          <footer className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-md border-t px-2 py-1 flex justify-around items-center transition-colors shadow-2xl shadow-black/80 bg-slate-900/95 border-slate-800">
            <button
              onClick={() => setCurrentTab("home")}
              className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-xl transition-all relative ${
                currentTab === "home"
                  ? "text-[#0078D4] scale-105 font-bold"
                  : "text-slate-400"
              }`}
            >
              <HomeIcon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Ahabanza</span>
              {currentTab === "home" && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute bottom-0.5 w-1 h-1 bg-[#0078D4] rounded-full"
                ></motion.span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("deposit")}
              className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-xl transition-all relative ${
                currentTab === "deposit"
                  ? "text-[#0078D4] scale-105 font-bold"
                  : "text-slate-400"
              }`}
            >
              <ArrowUpCircle className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Kubitsa</span>
              {currentTab === "deposit" && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute bottom-0.5 w-1 h-1 bg-[#0078D4] rounded-full"
                ></motion.span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("invest")}
              className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-xl transition-all relative ${
                currentTab === "invest"
                  ? "text-[#0078D4] scale-105 font-bold"
                  : "text-slate-400"
              }`}
            >
              <TrendingUp className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Gushora Imari</span>
              {currentTab === "invest" && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute bottom-0.5 w-1 h-1 bg-[#0078D4] rounded-full"
                ></motion.span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("withdraw")}
              className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-xl transition-all relative ${
                currentTab === "withdraw"
                  ? "text-[#0078D4] scale-105 font-bold"
                  : "text-slate-400"
              }`}
            >
              <ArrowDownCircle className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Kubikuza</span>
              {currentTab === "withdraw" && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute bottom-0.5 w-1 h-1 bg-[#0078D4] rounded-full"
                ></motion.span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab("account")}
              className={`flex flex-col items-center justify-center w-14 py-1.5 rounded-xl transition-all relative ${
                currentTab === "account"
                  ? "text-[#0078D4] scale-105 font-bold"
                  : "text-slate-400"
              }`}
            >
              <User className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Konti</span>
              {currentTab === "account" && (
                <motion.span
                  layoutId="active-dot"
                  className="absolute bottom-0.5 w-1 h-1 bg-[#0078D4] rounded-full"
                ></motion.span>
              )}
            </button>
          </footer>

          {/* --- CONFIRM INVESTMENT MODAL --- */}
          <AnimatePresence>
            {confirmingProduct && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmingProduct(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  className={`relative w-full max-w-sm rounded-[24px] p-5 shadow-2xl overflow-hidden z-10 ${
                    darkMode
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                        {confirmingProduct.planName}
                      </span>
                      <h3 className="text-lg font-bold mt-1 text-[#0078D4]">
                        {confirmingProduct.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 py-3 border-t border-b border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Igishoro Cyashowe:</span>
                      <span className="font-extrabold font-mono text-slate-350">
                        {formatFrw(confirmingProduct.investmentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inyungu Ku Munsi:</span>
                      <span className="font-extrabold font-mono text-emerald-500">
                        +{formatFrw(confirmingProduct.dailyIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        Igihe cy'Ishoramari:
                      </span>
                      <span className="font-extrabold text-slate-350">
                        {confirmingProduct.durationDays} Iminsi
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 font-bold text-sm">
                      <span className="text-slate-400">
                        Inyungu Yose Yizewe:
                      </span>
                      <span className="font-extrabold text-sky-400 font-mono">
                        {formatFrw(confirmingProduct.totalIncome)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmingProduct(null)}
                      className={`py-3 rounded-xl font-bold text-xs transition ${
                        darkMode
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      Guhagarika
                    </button>
                    <button
                      type="button"
                      onClick={handleInvestConfirm}
                      className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs shadow-md shadow-emerald-500/20"
                    >
                      Emeza Gushora Imari
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* --- LUCKY SPIN WHEEL MODAL --- */}
          <AnimatePresence>
            {isLuckyWheelOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => {
                    if (!wheelSpinning) setIsLuckyWheelOpen(false);
                  }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={`relative w-full max-w-sm rounded-[24px] p-6 text-center z-10 transition-colors ${
                    darkMode
                      ? "bg-slate-900 border border-slate-800"
                      : "bg-white"
                  }`}
                >
                  <h3 className="text-lg font-bold text-[#0078D4] flex items-center justify-center gap-1.5">
                    <Gift className="w-5 h-5 text-amber-500 animate-pulse" />{" "}
                    Itora ry'Amahirwe
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-6">
                    Buri nshuro ihagaze{" "}
                    <span className="font-bold text-orange-500">500 Frw</span>.
                    Ibihembo byizewe bihita byiyongera ku mafaranga yawe.
                  </p>

                  {/* WHEEL CONTAINER */}
                  <div className="relative mx-auto w-40 h-40 flex items-center justify-center my-4">
                    <motion.div
                      animate={wheelSpinning ? { rotate: 1440 } : { rotate: 0 }}
                      transition={
                        wheelSpinning
                          ? { duration: 2.5, ease: "easeOut" }
                          : { duration: 0.1 }
                      }
                      className="absolute inset-0 rounded-full border-[10px] border-amber-500 bg-gradient-to-tr from-amber-600 via-orange-500 to-rose-600 flex items-center justify-center"
                    />
                    <div className="relative z-10 w-24 h-24 rounded-full bg-slate-900 flex flex-col items-center justify-center border-4 border-amber-400 text-white shadow-xl">
                      {wheelSpinning ? (
                        <span className="text-[10px] font-bold tracking-widest text-amber-400 animate-ping">
                          KUZUNGURUKA
                        </span>
                      ) : (
                        <span className="text-xs font-black tracking-tight text-white uppercase leading-none">
                          MICRO
                          <br />
                          HUB
                        </span>
                      )}
                    </div>
                    {/* Pointer Indicator */}
                    <div
                      className="absolute top-0 left-1/2 -ml-2 -mt-4 w-4 h-6 bg-red-500 clip-triangle z-20"
                      style={{ transform: "rotate(180deg)" }}
                    ></div>
                  </div>

                  {wheelResult && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-3.5 my-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20"
                    >
                      <p className="text-[11px] font-bold text-slate-500">
                        URASHEZWE CYANE!
                      </p>
                      <p className="text-sm font-extrabold text-emerald-500">
                        {wheelResult}
                      </p>
                    </motion.div>
                  )}

                  <div className="mt-6 flex flex-col gap-2">
                    <button
                      onClick={handleLuckySpin}
                      disabled={wheelSpinning}
                      className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-amber-500/20"
                    >
                      {wheelSpinning ? "Gukina..." : "KINA KURI 500 FRW"}
                    </button>
                    <button
                      type="button"
                      disabled={wheelSpinning}
                      onClick={() => setIsLuckyWheelOpen(false)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-400 mt-2 hover:underline"
                    >
                      Funga Umukino
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* --- MOCK COMPLAINT CHAT SUPPORT DRAWER --- */}
          <AnimatePresence>
            {isCheckinOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className={`w-full max-w-sm rounded-[24px] p-6 shadow-2xl border flex flex-col items-center text-center ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white"
                      : "bg-white border-slate-100 text-slate-800"
                  }`}
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <CalendarCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold font-display mb-2">
                    Inyungu y'Umunsi
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                    Kanda hano ufate inyungu yawe ya buri munsi yo kwinjira muri
                    porogaramu yacu.
                  </p>

                  <div className="text-3xl font-black text-emerald-500 font-mono mb-6 border-2 border-emerald-500/20 bg-emerald-500/5 px-6 py-3 rounded-2xl">
                    150 Frw
                  </div>

                  <div className="flex gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => setIsCheckinOpen(false)}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm ${
                        darkMode
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                      }`}
                    >
                      Funga
                    </button>
                    <button
                      type="button"
                      onClick={handleDailyCheckin}
                      disabled={hasCheckedInToday}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm shadow-md transition ${
                        hasCheckedInToday
                          ? "bg-slate-300 dark:bg-slate-700 text-slate-500 opacity-50 cursor-not-allowed"
                          : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-500/20"
                      }`}
                    >
                      {hasCheckedInToday ? "Imwe Yafashwe" : "Fata Inyungu"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isSupportOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSupportOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className={`relative w-full max-w-sm rounded-t-[28px] p-4 flex flex-col h-[75vh] z-10 ${
                    darkMode
                      ? "bg-slate-900 text-slate-100"
                      : "bg-white text-slate-900"
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                        <PhoneCall className="w-4 h-4 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase font-sans">
                          Ikigo Cy'Ubufasha
                        </h3>
                        <div className="flex items-center gap-1 text-[9px] text-green-500 leading-none">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>{" "}
                          Ihuje
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsSupportOpen(false)}
                      className="p-1 px-3.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold font-sans"
                    >
                      Funga
                    </button>
                  </div>

                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 pr-1">
                    {chatHistory.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[85%] ${msg.sender === "user" ? "self-end items-end" : "self-start"}`}
                      >
                        <div
                          className={`p-3 rounded-2xl text-xs ${
                            msg.sender === "user"
                              ? "bg-[#0078D4] text-white rounded-br-sm"
                              : "bg-slate-100 dark:bg-slate-850 dark:text-slate-300 rounded-bl-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1 font-mono">
                          {msg.time}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Input section */}
                  <form
                    onSubmit={handleSendChat}
                    className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Baza ikibazo kijyanye no kubitsa cyangwa gushora..."
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      className={`flex-1 p-3 rounded-xl text-xs outline-none border focus:border-[#0078D4] ${
                        darkMode
                          ? "bg-slate-950 border-slate-800 text-white"
                          : "bg-slate-50 border-slate-150 text-slate-800"
                      }`}
                      required
                    />
                    <button
                      type="submit"
                      className="p-3 px-5 rounded-xl bg-[#0078D4] hover:bg-blue-600 text-white font-extrabold text-xs shrink-0"
                    >
                      Yohereza
                    </button>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

// --- SUB-COMPONENT: PRODUCT CARD ---
interface ProductCardProps {
  product: InvestmentProduct;
  onInvest: (product: InvestmentProduct) => void;
  formatFrw: (num: number) => string;
  darkMode: boolean;
  key?: number | string;
}

function ProductCard({
  product,
  onInvest,
  formatFrw,
  darkMode,
}: ProductCardProps) {
  const isStandard = product.planName.toLowerCase().includes("standard");

  return (
    <div
      className={`rounded-[20px] p-4 border flex flex-col gap-3 transition-all outline-none duration-300 relative group overflow-hidden ${
        isStandard
          ? darkMode
            ? "bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-[#0078D4]/50 shadow-blue-950/20 shadow-md"
            : "bg-white border-2 border-[#0078D4]/30 shadow-md hover:shadow-lg"
          : darkMode
            ? "bg-slate-900 border-slate-800 shadow-slate-950/20 shadow-sm hover:border-[#0078D4]/40"
            : "bg-white border-slate-200/60 shadow-sm hover:border-[#0078D4]/30 hover:shadow-md"
      }`}
    >
      {/* Absolute shimmer glow effect on card hover */}
      <div className="absolute -right-20 -top-20 w-44 h-44 bg-[#0078D4]/10 rounded-full blur-3xl transition duration-300 opacity-0 group-hover:opacity-100" />

      {/* PLAN HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <span
            className={`text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${
              isStandard
                ? "bg-[#0078D4] text-white"
                : "bg-[#0078D4]/10 text-[#0078D4]"
            }`}
          >
            {product.planName}
          </span>
          <h4 className="text-[14px] font-extrabold font-display tracking-tight text-slate-800 dark:text-slate-100 mt-1.5 transition-colors duration-200 group-hover:text-[#0078D4] dark:group-hover:text-blue-450">
            {product.name}
          </h4>
        </div>
      </div>

      {/* CONTENT REGION: DETAILS LEFT, PRODUCT IMAGE RIGHT */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-center">
        {/* Statistics Information Boxes */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div
              className={`p-2 rounded-xl border flex flex-col justify-center ${
                isStandard
                  ? darkMode
                    ? "bg-[#0078D4]/20 border-blue-900 text-[#0078D4]"
                    : "bg-blue-50/60 border-blue-100 text-blue-700"
                  : darkMode
                    ? "bg-slate-950 border-slate-850"
                    : "bg-slate-50 border-slate-100"
              }`}
            >
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                Igishoro
              </span>
              <span
                className={`text-[11px] font-bold mt-1 font-mono ${
                  isStandard
                    ? "text-[#0078D4] dark:text-sky-300"
                    : "text-slate-700 dark:text-slate-350"
                }`}
              >
                {formatFrw(product.investmentAmount)}
              </span>
            </div>

            <div
              className={`p-2 rounded-xl border flex flex-col justify-center ${
                darkMode
                  ? "bg-emerald-950/20 border-emerald-900/30"
                  : "bg-emerald-50 border-emerald-100/60"
              }`}
            >
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                Inyungu ku Munsi
              </span>
              <span className="text-[11px] font-bold mt-1 font-mono text-[#28a745]">
                +{formatFrw(product.dailyIncome)}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center px-0.5 text-[10px] text-slate-400">
            <span>
              Igihe:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {product.durationDays} Iminsi
              </strong>
            </span>
            <span>
              Inyungu:{" "}
              <strong className="text-[#0078D4] dark:text-sky-400 font-mono">
                {formatFrw(product.totalIncome)}
              </strong>
            </span>
          </div>
        </div>

        {/* Product Image with Referrer Privacy */}
        <div className="relative shrink-0 group/img">
          <div className="absolute inset-0 bg-blue-500/10 rounded-2xl scale-0 group-hover/img:scale-105 transition duration-200" />
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-16 h-16 object-cover rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner group-hover/img:scale-105 transition-transform duration-300"
          />
        </div>
      </div>

      {/* FINAL ROW CONTAINER: INVEST BUTTON BOTTOM RIGHT */}
      <div className="flex justify-between items-center mt-1 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex flex-col">
          <span className="text-[8px] uppercase font-bold text-slate-400">
            Inyungu Yose
          </span>
          <span className="text-[14px] font-black text-[#28a745] font-mono tracking-tight">
            {formatFrw(product.totalIncome)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onInvest(product)}
          className="py-2 px-3.5 rounded-lg bg-[#28a745] hover:bg-[#218838] active:scale-[0.97] transition-all text-white text-xs font-black tracking-wide shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1"
        >
          SHORA IMARI
        </button>
      </div>
    </div>
  );
}
