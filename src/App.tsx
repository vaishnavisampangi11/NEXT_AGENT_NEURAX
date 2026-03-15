import React, { useState, useEffect, useRef, Component } from 'react';
import { 
  Users, 
  Briefcase, 
  History, 
  Wrench, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ChevronRight,
  Database,
  BrainCircuit,
  LayoutDashboard,
  Download,
  FileText,
  Table,
  Sparkles,
  ArrowRight,
  Upload,
  File,
  Search,
  MessageSquare,
  Send,
  X,
  LogIn,
  LogOut,
  Heart,
  Star,
  Smile,
  Rocket,
  Zap,
  Globe,
  Shield,
  MousePointer2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Parser } from '@json2csv/plainjs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { auth, db, signInWithGoogle, logout } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  doc,
  updateDoc,
  query as fsQuery, 
  where, 
  orderBy, 
  onSnapshot, 
  Timestamp,
  serverTimestamp,
  getDocs,
  deleteDoc,
  getDocFromCache,
  getDocFromServer
} from 'firebase/firestore';

// Error Handling Types
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error.message);
        if (parsed.error) displayMessage = `Firestore Error: ${parsed.error}`;
      } catch (e) {
        displayMessage = this.state.error.message || displayMessage;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="surface-elevated p-8 max-w-md w-full text-center">
            <AlertCircle className="text-destructive w-12 h-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Application Error</h2>
            <p className="text-muted-foreground mb-6 text-sm">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// Extend jsPDF with autotable types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface Employee {
  id?: string;
  employee_id: string;
  name: string;
  role: string;
  skills: string;
  experience_years: string;
  current_workload_percent: string;
  completed_on_time?: number;
  delayed?: number;
  total_tasks_assigned?: number;
  total_tasks_completed?: number;
  current_project?: string;
}

interface Tool {
  tool_id: string;
  tool_name: string;
  tool_type: string;
  purpose: string;
}

interface Project {
  project_id: string;
  project_name: string;
  description: string;
  required_skills: string;
  deadline_days: string;
  priority: string;
}

interface WorkflowResult {
  analysis: string;
  agentTeam: {
    name: string;
    role: string;
    contribution: string;
  }[];
  tasks: {
    title: string;
    description: string;
    assignedTo: string;
    tools: string[];
  }[];
  tools: string[];
  status: string;
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  content: string;
  analysis?: {
    project: string;
    description: string;
    requiredSkills: string;
    priority: string;
  };
}

export default function App() {
  return <AppContent />;
}

function RobotCharacter() {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Beep boop! Ready to work?",
    "I've optimized your tasks! ✨",
    "Need a hand with that project?",
    "Your workflow looks great today!",
    "Let's automate something fun!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ y: 0 }}
      animate={{ y: [0, -15, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="relative w-48 h-64 flex flex-col items-center justify-center"
    >
      {/* Speech Bubble */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={messageIndex}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          className="absolute -top-20 -right-12 bg-white text-primary text-[10px] font-bold px-4 py-2 rounded-2xl rounded-bl-none shadow-xl border border-primary/10 whitespace-nowrap z-30"
        >
          {messages[messageIndex]}
          <div className="absolute -bottom-2 left-0 w-4 h-4 bg-white border-l border-b border-primary/10 rotate-45" />
        </motion.div>
      </AnimatePresence>

      {/* Robot Head */}
      <motion.div 
        animate={{ rotate: [0, -2, 2, 0] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="w-32 h-24 bg-primary rounded-[2rem] relative shadow-xl border-4 border-white/20 flex items-center justify-center"
      >
        {/* Antenna */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1 h-6 bg-primary/60">
          <motion.div 
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full shadow-[0_0_10px_#00FF00]"
          />
        </div>

        {/* Eyes */}
        <div className="flex gap-6">
          <motion.div 
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
            className="w-4 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          />
          <motion.div 
            animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
            className="w-4 h-6 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          />
        </div>

        {/* Blushing */}
        <div className="absolute bottom-4 left-4 w-4 h-2 bg-pink-400/30 blur-sm rounded-full" />
        <div className="absolute bottom-4 right-4 w-4 h-2 bg-pink-400/30 blur-sm rounded-full" />
      </motion.div>

      {/* Robot Body */}
      <motion.div 
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-20 h-24 bg-primary/90 rounded-[1.5rem] -mt-2 shadow-lg border-x-4 border-b-4 border-white/10 flex flex-col items-center pt-4"
      >
        {/* Heart/Core */}
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Heart size={16} className="text-pink-400 fill-pink-400" />
        </motion.div>
        
        {/* Buttons */}
        <div className="mt-4 space-y-1">
          <div className="w-8 h-1 bg-white/20 rounded-full" />
          <div className="w-6 h-1 bg-white/20 rounded-full" />
        </div>
      </motion.div>

      {/* Floating Hands */}
      <motion.div 
        animate={{ y: [0, -5, 0], x: [0, 5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute left-0 top-32 w-8 h-8 bg-primary/80 rounded-full border-2 border-white/20 flex items-center justify-center"
      >
        <div className="w-3 h-3 bg-white/40 rounded-full" />
      </motion.div>
      <motion.div 
        animate={{ y: [0, 5, 0], x: [0, -5, 0], rotate: [0, 20, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute right-0 top-32 w-8 h-8 bg-primary/80 rounded-full border-2 border-white/20 flex items-center justify-center"
      >
        <div className="w-3 h-3 bg-white/40 rounded-full" />
      </motion.div>

      {/* Shadow */}
      <motion.div 
        animate={{ scale: [1, 0.8, 1], opacity: [0.2, 0.1, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="w-24 h-4 bg-black/20 rounded-full blur-md mt-8"
      />
    </motion.div>
  );
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  const [activeSection, setActiveSection] = useState<'home' | 'about'>('home');

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] selection:bg-primary/20 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 flex items-center justify-between px-8 md:px-16 z-50 bg-white/30 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-300">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-primary">NextAgent</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setActiveSection('home')}
            className={`text-sm font-bold transition-colors ${activeSection === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            Home
          </button>
          <button 
            onClick={() => setActiveSection('about')}
            className={`text-sm font-bold transition-colors ${activeSection === 'about' ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
          >
            About
          </button>
          <div className="flex items-center gap-3 ml-4">
            <button 
              onClick={onLogin}
              className="px-6 py-2 rounded-full text-sm font-bold text-primary hover:bg-primary/5 transition-all"
            >
              Login
            </button>
            <button 
              onClick={onLogin}
              className="px-6 py-2 rounded-full text-sm font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {activeSection === 'home' ? (
          <motion.main 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pt-32 pb-20 px-8 md:px-16"
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest"
                >
                  <Sparkles size={14} />
                  The Future of Work is Here
                </motion.div>
                
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                  Meet Your <span className="text-primary">Virtual</span> Avatar.
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                  NextAgent is your intelligent virtual product manager—a cute robot automating your workflow with precision and personality.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={onLogin}
                    className="px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                  >
                    Get Started Free <ArrowRight size={20} />
                  </button>
                  <div className="flex -space-x-3 items-center">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-4 border-white bg-secondary flex items-center justify-center overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    <span className="pl-6 text-sm font-bold text-muted-foreground">Trusted by 2,000+ teams</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 pt-8 border-t border-black/5">
                  <div>
                    <div className="text-3xl font-black text-primary">99%</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Efficiency</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-primary">24/7</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Availability</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-primary">100%</div>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Reliability</div>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                {/* The Robot Character */}
                <div className="absolute -left-20 -top-20 z-20">
                  <RobotCharacter />
                </div>

                <motion.div 
                  animate={{ 
                    y: [0, -20, 0],
                    rotate: [0, 2, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10 surface-elevated p-8 rounded-[40px] shadow-2xl border-white/50 text-white"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                      <BrainCircuit className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold">NextAgent Avatar</h3>
                      <p className="text-xs text-white/60">Always active & happy!</p>
                    </div>
                    <div className="ml-auto flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                      <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
                      <div className="w-2 h-2 rounded-full bg-[#28c840]" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Rocket size={14} className="text-primary" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">New Task</span>
                      </div>
                      <p className="text-sm font-medium">"Hey! I've decomposed your project into 5 actionable steps. Want to see?"</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-primary/20 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart size={14} className="text-pink-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400">Status Update</span>
                      </div>
                      <p className="text-sm font-medium">"Aarav is working hard on the AI model. He's doing great! ✨"</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Smile size={16} className="text-primary" /></div>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Zap size={16} className="text-warning" /></div>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><Star size={16} className="text-accent" /></div>
                    </div>
                    <button className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold">View Dashboard</button>
                  </div>
                </motion.div>

                {/* Decorative Elements */}
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl"
                />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/5 via-transparent to-pink-500/5 rounded-full blur-3xl -z-10" />
              </div>
            </div>
          </motion.main>
        ) : (
          <motion.section 
            key="about"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="pt-32 pb-20 px-8 md:px-16 max-w-5xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <Globe size={14} />
              About NextAgent
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-8">
              We make AI <span className="text-primary">Human</span> & Helpful.
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed mb-16 max-w-3xl mx-auto">
              NextAgent was born from the idea that enterprise tools don't have to be boring. We've combined state-of-the-art multi-agent orchestration with a delightful user experience to help you get more done while having more fun.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Shield, title: "Secure", desc: "Enterprise-grade security for your data." },
                { icon: Zap, title: "Fast", desc: "Instant task decomposition and assignment." },
                { icon: Heart, title: "Friendly", desc: "A UI that loves you back." }
              ].map((feature, i) => (
                <div key={i} className="surface-elevated p-8 rounded-3xl text-left hover:border-primary/50 transition-all text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <feature.icon className="text-primary" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 p-12 rounded-[40px] bg-primary text-white text-center relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-3xl font-black mb-4">Ready to meet your new agent?</h3>
                <p className="mb-8 opacity-80">Join thousands of teams already using NextAgent.</p>
                <button 
                  onClick={onLogin}
                  className="px-8 py-4 rounded-2xl bg-white text-primary font-bold hover:scale-105 active:scale-95 transition-all"
                >
                  Start Your Journey
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32" />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="py-12 px-8 md:px-16 border-t border-black/5 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BrainCircuit className="text-white w-5 h-5" />
            </div>
            <span className="font-black text-primary">NextAgent</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 NextAgent AI. Made with ❤️ for you.</p>
        </div>
      </footer>
    </div>
  );
}

function AppContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [enrichedEmployees, setEnrichedEmployees] = useState<Employee[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [quickProjectName, setQuickProjectName] = useState('');
  const [projectRequest, setProjectRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [memory, setMemory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'files' | 'teams' | 'data' | 'history'>('dashboard');

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // File Upload States
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'agent'; text: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [highlightedFiles, setHighlightedFiles] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState<'idle' | 'orchestrating' | 'simulating'>('idle');

  // History Search State
  const [historySearch, setHistorySearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [dataSearch, setDataSearch] = useState('');
  const [workflowHistory, setWorkflowHistory] = useState<any[]>([]);
  const [projectHistory, setProjectHistory] = useState<any[]>([]);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Dashboard Stats Calculations
  const activeProjectsCount = projects.length;
  const totalTasksCount = workflowHistory.reduce((acc, curr) => acc + (curr.tasks?.length || 0), 0);
  const avgUtilization = employees.length > 0 
    ? Math.round(employees.reduce((acc, curr) => acc + parseInt(curr.current_workload_percent || '0'), 0) / employees.length)
    : 0;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const seedEmployees = async (force = false) => {
    if (!user) return;
    try {
      const employeesCol = collection(db, 'employees');
      const snapshot = await getDocs(employeesCol);
      
      if (snapshot.empty || force) {
        if (force) {
          // Delete existing docs for a clean sync
          for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
          }
        }
        
        const res = await fetch('/api/data/employees');
        const csvData = await res.json();
        
        // Batching would be better but for 500 it's okay in a loop for a one-time thing
        for (const emp of csvData) {
          await addDoc(employeesCol, {
            ...emp,
            uid: user.uid,
            timestamp: serverTimestamp()
          });
        }
        console.log("Employees seeded successfully");
        fetchData();
      }
    } catch (error) {
      console.error("Error seeding employees:", error);
    }
  };

  const seedTools = async (force = false) => {
    if (!user) return;
    try {
      const toolsCol = collection(db, 'tools');
      const snapshot = await getDocs(toolsCol);
      if (snapshot.empty || force) {
        if (force) {
          for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
          }
        }
        const res = await fetch('/api/data/tools');
        const csvData = await res.json();
        for (const tool of csvData) {
          await addDoc(toolsCol, {
            ...tool,
            uid: user.uid,
            timestamp: serverTimestamp()
          });
        }
        console.log("Tools seeded successfully");
        fetchData();
      }
    } catch (error) {
      console.error("Error seeding tools:", error);
    }
  };

  const seedHistory = async (force = false) => {
    if (!user) return;
    try {
      const historyCol = collection(db, 'project_history');
      const snapshot = await getDocs(historyCol);
      if (snapshot.empty || force) {
        if (force) {
          for (const doc of snapshot.docs) {
            await deleteDoc(doc.ref);
          }
        }
        const res = await fetch('/api/data/history');
        const csvData = await res.json();
        for (const item of csvData) {
          await addDoc(historyCol, {
            ...item,
            uid: user.uid,
            timestamp: serverTimestamp()
          });
        }
        console.log("History seeded successfully");
        fetchData();
      }
    } catch (error) {
      console.error("Error seeding history:", error);
    }
  };

  const handleResetAndSync = async () => {
    setLoading(true);
    setSystemStatus('orchestrating');
    try {
      await seedEmployees(true);
      await seedTools(true);
      await seedHistory(true);
      console.log("System data reset and synchronized with CSV files.");
    } catch (error) {
      console.error("Reset failed:", error);
    } finally {
      setLoading(false);
      setSystemStatus('idle');
    }
  };

  useEffect(() => {
    if (isAuthReady && user) {
      fetchData();
      seedEmployees();
      seedTools();
      seedHistory();
      
      // Test Firestore connection
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(db, 'test', 'connection'));
        } catch (error: any) {
          if (error.message?.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
          }
        }
      };
      testConnection();
      
      // Real-time history listeners
      const wq = fsQuery(collection(db, 'workflows'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
      const unsubscribeWorkflows = onSnapshot(wq, (snapshot) => {
        setWorkflowHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'workflows');
      });

      const qq = fsQuery(collection(db, 'file_queries'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'));
      const unsubscribeQueries = onSnapshot(qq, (snapshot) => {
        setQueryHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'file_queries');
      });

      return () => {
        unsubscribeWorkflows();
        unsubscribeQueries();
      };
    }
  }, [isAuthReady, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const selectedProject = projects.find(p => p.project_id === selectedProjectId);
  const selectedFile = uploadedFiles.find(f => f.id === selectedFileId);

  useEffect(() => {
    if (selectedProject) {
      setProjectRequest(`Project: ${selectedProject.project_name}\nDescription: ${selectedProject.description}\nRequired Skills: ${selectedProject.required_skills}\nPriority: ${selectedProject.priority}`);
    }
  }, [selectedProjectId, projects]);

  useEffect(() => {
    if (employees.length > 0 && workflowHistory.length >= 0) {
      const enriched = employees.map(emp => {
        const empWorkflows = workflowHistory.filter(wf => 
          wf.tasks?.some((t: any) => t.assignedTo === emp.name)
        );

        const totalAssigned = empWorkflows.reduce((acc, wf) => 
          acc + wf.tasks.filter((t: any) => t.assignedTo === emp.name).length, 0
        );

        const totalCompleted = empWorkflows.reduce((acc, wf) => 
          acc + wf.tasks.filter((t: any) => t.assignedTo === emp.name && t.status === 'completed').length, 0
        );

        const currentProject = empWorkflows.length > 0 ? empWorkflows[0].project : 'None';

        // Mocking on-time/delayed for now as it's not in the schema yet
        // In a real app, we'd track this per task
        const completedOnTime = Math.floor(totalCompleted * 0.8);
        const delayed = totalCompleted - completedOnTime;

        return {
          ...emp,
          total_tasks_assigned: totalAssigned,
          total_tasks_completed: totalCompleted,
          current_project: currentProject,
          completed_on_time: completedOnTime,
          delayed: delayed
        };
      });
      setEnrichedEmployees(enriched);
    }
  }, [employees, workflowHistory]);

  const fetchData = async () => {
    try {
      const [memRes] = await Promise.all([
        fetch('/api/data/memory')
      ]);
      
      // Fetch from Firestore
      const [empSnapshot, toolSnapshot, histSnapshot] = await Promise.all([
        getDocs(collection(db, 'employees')),
        getDocs(collection(db, 'tools')),
        getDocs(collection(db, 'project_history'))
      ]);

      const empList = empSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as Employee));
      const toolList = toolSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as Tool));
      const histList = histSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      setEmployees(empList);
      setTools(toolList);
      setProjectHistory(histList);
      setMemory(await memRes.json());
      
      // Also fetch projects from API as they are not in Firestore yet (or add them too)
      const projRes = await fetch('/api/data/projects');
      setProjects(await projRes.json());
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleWorkflowFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    let content = '';
    try {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        content = await file.text();
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        content = text;
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.srs')) {
        content = await file.text();
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        content = await file.text();
      } else {
        alert("Unsupported file type. Please upload CSV, PDF, TXT, MD, or JSON.");
        return;
      }
    } catch (err) {
      console.error("File reading error:", err);
      alert("Failed to read file content.");
      return;
    }

    setLoading(true);
    setSystemStatus('orchestrating');
    setResult(null);
    
    try {
      const { analyzeFile, runWorkflow } = await import('./services/agentService.ts');
      
      // Step 1: Analyze the file to get project details
      const analysis = await analyzeFile(file.name, content);
      
      // Step 2: Prepare datasets
      const [toolRes, histRes] = await Promise.all([
        fetch('/api/data/tools'),
        fetch('/api/data/history')
      ]);
      const datasets = {
        employees: enrichedEmployees.length > 0 ? enrichedEmployees : employees,
        tools: await toolRes.json(),
        history: await histRes.json()
      };

      // Step 3: Run workflow based on analysis
      const finalRequest = `PROJECT: ${analysis.project}\nDESCRIPTION: ${analysis.description}\nREQUIRED SKILLS: ${analysis.requiredSkills}\nPRIORITY: ${analysis.priority}`;
      const workflowResult = await runWorkflow(finalRequest, datasets);
      setResult(workflowResult);

      // Save to Firestore
      if (user) {
        try {
          await addDoc(collection(db, 'workflows'), {
            uid: user.uid,
            project: analysis.project || "Analyzed Project",
            request: `File Upload Analysis: ${file.name}`,
            analysis: workflowResult.analysis,
            tasks: workflowResult.tasks,
            progress: workflowResult.overallProgress || 0,
            timestamp: Timestamp.now()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'workflows');
        }
      }

      // Add to uploaded files for reference
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        content: content,
        analysis
      };
      setUploadedFiles(prev => [...prev, newFile]);

    } catch (err) {
      console.error("Workflow file upload error:", err);
      alert("Failed to analyze and initiate workflow.");
    } finally {
      setLoading(false);
      setSystemStatus('idle');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      return;
    }

    let content = '';
    try {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        content = await file.text();
      } else if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        content = text;
      } else if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.srs')) {
        content = await file.text();
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        content = await file.text();
      } else {
        alert("Unsupported file type. Please upload CSV, PDF, TXT, MD, or JSON.");
        return;
      }
    } catch (err) {
      console.error("File reading error:", err);
      alert("Failed to read file content.");
      return;
    }

    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type,
      content: content
    };

    setUploadedFiles(prev => [...prev, newFile]);
    setSelectedFileId(newFile.id);
    
    setActiveTab('files');
    
    // Auto-analyze
    handleAnalyzeFile(newFile);
  };

  const handleAnalyzeFile = async (file: UploadedFile) => {
    setIsAnalyzing(true);
    try {
      const { analyzeFile } = await import('./services/agentService.ts');
      const analysis = await analyzeFile(file.name, file.content);
      setUploadedFiles(prev => prev.map(f => f.id === file.id ? { ...f, analysis } : f));
      
      // Populate projectRequest with structured analysis
      const formattedAnalysis = `PROJECT: ${analysis.project}\nDESCRIPTION: ${analysis.description}\nREQUIRED SKILLS: ${analysis.requiredSkills}\nPRIORITY: ${analysis.priority}`;
      setProjectRequest(prev => prev ? `${prev}\n\n--- Analysis of ${file.name} ---\n${formattedAnalysis}` : formattedAnalysis);
    } catch (err) {
      console.error("Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQueryFile = async () => {
    if (!query.trim() || uploadedFiles.length === 0) return;

    const userMsg = { role: 'user' as const, text: query };
    setChatHistory(prev => [...prev, userMsg]);
    setQuery('');
    setIsQuerying(true);
    setHighlightedFiles([]);

    try {
      const { queryAllFiles } = await import('./services/agentService.ts');
      const response = await queryAllFiles(query, uploadedFiles.map(f => ({ name: f.name, content: f.content })));
      
      setChatHistory(prev => [...prev, { role: 'agent', text: response.answer }]);
      setHighlightedFiles(response.sourceFiles);

      // Save to Firestore
      if (user) {
        try {
          await addDoc(collection(db, 'file_queries'), {
            uid: user.uid,
            fileName: response.sourceFiles.join(', ') || 'All Files',
            query,
            answer: response.answer,
            sourceFiles: response.sourceFiles,
            timestamp: Timestamp.now()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'file_queries');
        }
      }
    } catch (err) {
      console.error("Query error:", err);
      setChatHistory(prev => [...prev, { role: 'agent', text: "Error: Could not process query." }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleQuickExecute = async () => {
    if (!quickProjectName.trim()) return;
    setLoading(true);
    setSystemStatus('orchestrating');
    setResult(null);
    try {
      const prompt = `Generate detailed project requirements, priority, and task list for a new project named: "${quickProjectName}". Then execute the workflow.`;
      
      const [toolRes, histRes] = await Promise.all([
        fetch('/api/data/tools'),
        fetch('/api/data/history')
      ]);
      const datasets = {
        employees: enrichedEmployees.length > 0 ? enrichedEmployees : employees,
        tools: await toolRes.json(),
        history: await histRes.json()
      };

      const { runWorkflow } = await import('./services/agentService.ts');
      const workflowResult = await runWorkflow(prompt, datasets);
      setResult(workflowResult);

      if (user) {
        try {
          await addDoc(collection(db, 'workflows'), {
            uid: user.uid,
            project: quickProjectName,
            request: prompt,
            analysis: workflowResult.analysis,
            tasks: workflowResult.tasks,
            progress: workflowResult.overallProgress || 0,
            timestamp: Timestamp.now()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'workflows');
        }
      }
      setQuickProjectName('');
    } catch (err) {
      console.error("Quick execute error:", err);
    } finally {
      setLoading(false);
      setSystemStatus('idle');
    }
  };

  const handleRunWorkflow = async () => {
    const finalRequest = selectedProject 
      ? `ASSIGN PROJECT: ${selectedProject.project_name}\n${projectRequest}`
      : projectRequest;

    if (!finalRequest.trim()) return;
    setLoading(true);
    setSystemStatus('orchestrating');
    setResult(null);
    try {
      const [toolRes, histRes] = await Promise.all([
        fetch('/api/data/tools'),
        fetch('/api/data/history')
      ]);
      const datasets = {
        employees: enrichedEmployees.length > 0 ? enrichedEmployees : employees,
        tools: await toolRes.json(),
        history: await histRes.json()
      };

      const { runWorkflow } = await import('./services/agentService.ts');
      const workflowResult = await runWorkflow(finalRequest, datasets);
      setResult(workflowResult);

      // Save to Firestore
      if (user) {
        try {
          await addDoc(collection(db, 'workflows'), {
            uid: user.uid,
            project: selectedProject?.project_name || "Custom Project",
            request: finalRequest,
            analysis: workflowResult.analysis,
            tasks: workflowResult.tasks,
            progress: workflowResult.overallProgress || 0,
            timestamp: Timestamp.now()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, 'workflows');
        }
      }

      await fetch('/api/data/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          project: selectedProject?.project_name || projectRequest.slice(0, 50), 
          decision: workflowResult 
        })
      });

      fetchData();
    } catch (err: any) {
      console.error("Workflow error:", err);
      alert("An error occurred. Check console for details.");
    } finally {
      setLoading(false);
      setSystemStatus('idle');
    }
  };

  const updateWorkflowTask = async (workflowId: string, taskIndex: number, newStatus: string) => {
    if (!user) return;
    try {
      const workflowRef = doc(db, 'workflows', workflowId);
      const workflowDoc = workflowHistory.find(w => w.id === workflowId);
      if (!workflowDoc) return;

      const updatedTasks = [...workflowDoc.tasks];
      updatedTasks[taskIndex] = { ...updatedTasks[taskIndex], status: newStatus };
      
      const completedCount = updatedTasks.filter(t => t.status === 'completed').length;
      const newProgress = Math.round((completedCount / updatedTasks.length) * 100);

      await updateDoc(workflowRef, {
        tasks: updatedTasks,
        progress: newProgress
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `workflows/${workflowId}`);
    }
  };

  const simulateWorkflow = async (workflowId: string) => {
    const workflowDoc = workflowHistory.find(w => w.id === workflowId);
    if (!workflowDoc) return;

    setSystemStatus('simulating');
    for (let i = 0; i < workflowDoc.tasks.length; i++) {
      if (workflowDoc.tasks[i].status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await updateWorkflowTask(workflowId, i, 'completed');
      }
    }
    setSystemStatus('idle');
  };

  const downloadCSV = () => {
    if (!result) return;
    try {
      const data = (result?.tasks || []).map(t => ({
        Project: selectedProject?.project_name || "Custom Project",
        Task: t.title,
        Description: t.description,
        AssignedTo: t.assignedTo,
        Tools: t.tools.join(', ')
      }));
      const parser = new Parser();
      const csv = parser.parse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `assignment_${selectedProject?.project_id || 'custom'}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("CSV Export Error:", err);
    }
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(22);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text("Project Strategic Analysis Report", 14, 22);
    
    // Meta Info
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Project: ${selectedProject?.project_name || "Custom Project"}`, 14, 32);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);
    doc.text(`Orchestrator: Multi-Agent System (Alex, Sam, Jordan)`, 14, 44);

    // Strategic Analysis Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Strategic Analysis", 14, 55);
    
    doc.setFontSize(10);
    const splitAnalysis = doc.splitTextToSize(result.analysis, 180);
    doc.text(splitAnalysis, 14, 62);
    
    const analysisHeight = (splitAnalysis.length * 5) + 70;

    // Tasks Table
    doc.setFontSize(14);
    doc.text("Execution Plan & Task Decomposition", 14, analysisHeight);

    const tableData = (result?.tasks || []).map(t => [
      t.title,
      t.description,
      t.assignedTo,
      t.tools.join(', '),
      t.priority.toUpperCase()
    ]);

    autoTable(doc, {
      startY: analysisHeight + 5,
      head: [['Task', 'Description', 'Assigned To', 'Tools', 'Priority']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 20 }
      }
    });

    doc.save(`strategic_analysis_${selectedProject?.project_id || 'custom'}.pdf`);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={signInWithGoogle} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <BrainCircuit className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tighter text-primary">NEXTAGENT</h1>
            <p className="text-[10px] text-sidebar-foreground font-mono uppercase tracking-widest">Autonomous AI</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'files' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
          >
            <FileText size={18} />
            File Agent
          </button>
          <button 
            onClick={() => setActiveTab('teams')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'teams' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
          >
            <Users size={18} />
            Teams
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'data' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
          >
            <Database size={18} />
            Resources
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
          >
            <History size={18} />
            History
          </button>
        </nav>

        <div className="p-4 mt-auto space-y-4">
          {user && (
            <div className="surface-card p-3 rounded-xl flex items-center gap-3">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-border" />
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-bold truncate">{user.displayName}</p>
                <button onClick={logout} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1">
                  <LogOut size={10} /> Logout
                </button>
              </div>
            </div>
          )}
          <div className="surface-card p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">System Status</span>
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            </div>
            <p className="text-xs font-medium text-foreground">All Agents Online</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/50 backdrop-blur-md flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Command Center /</span>
            <span className="text-sm font-semibold capitalize">{activeTab === 'dashboard' ? 'Workflow Overview' : activeTab}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
              <Database size={12} className="text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Scaled Engine Active</span>
            </div>
            {user && user.email === "girldhavi@gmail.com" && (
              <button 
                onClick={handleResetAndSync}
                disabled={loading}
                className="text-[10px] font-bold px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/30 transition-all flex items-center gap-2"
              >
                <Database size={12} /> Reset & Sync Data
              </button>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${systemStatus !== 'idle' ? 'bg-primary/10 border-primary/30' : 'bg-secondary/50 border-border'}`}>
              {systemStatus === 'orchestrating' ? (
                <Loader2 size={14} className="text-primary animate-spin" />
              ) : systemStatus === 'simulating' ? (
                <Play size={14} className="text-primary animate-pulse" />
              ) : (
                <Sparkles size={14} className="text-primary" />
              )}
              <span className="text-xs font-medium">
                {systemStatus === 'orchestrating' ? 'Agent Orchestrating' : 
                 systemStatus === 'simulating' ? 'Workflow Simulating' : 
                 'Agent Intel'}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="surface-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Active Projects</span>
                      <Briefcase size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{activeProjectsCount}</span>
                      <span className="text-xs text-success font-medium">+2 this week</span>
                    </div>
                  </div>
                  <div className="surface-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Total Tasks</span>
                      <CheckCircle2 size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{totalTasksCount}</span>
                      <span className="text-xs text-muted-foreground font-medium">3 in progress</span>
                    </div>
                  </div>
                  <div className="surface-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Team Utilization</span>
                      <Users size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{avgUtilization}%</span>
                      <span className="text-xs text-success font-medium">+5%</span>
                    </div>
                  </div>
                  <div className="surface-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">AI Confidence</span>
                      <BrainCircuit size={16} className="text-muted-foreground" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">82%</span>
                      <span className="text-xs text-destructive font-medium">1 conflict</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Active Workflows */}
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Active Workflows</h3>
                    <div className="space-y-4">
                      {workflowHistory.length === 0 ? (
                        <div className="surface-card p-12 text-center opacity-40">
                          <Play size={48} className="mx-auto mb-4" />
                          <p>No active workflows found</p>
                        </div>
                      ) : (
                        workflowHistory.slice(0, 4).map((wf, idx) => {
                          const progress = wf.progress || 0;
                          const completedTasks = wf.tasks?.filter((t: any) => t.status === 'completed').length || 0;
                          const isSimulating = wf.tasks?.some((t: any) => t.status !== 'completed') && progress < 100;
                          
                          return (
                            <div key={wf.id} className="surface-card p-6 hover:border-primary/30 transition-all group">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${progress === 100 ? 'bg-success' : 'bg-primary animate-pulse'}`} />
                                  <div>
                                    <h4 className="font-bold group-hover:text-primary transition-colors">{wf.project}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{wf.request.split('\n')[0]}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {progress < 100 && (
                                    <button 
                                      onClick={() => simulateWorkflow(wf.id)}
                                      className="text-[10px] font-mono px-2 py-1 bg-primary/10 text-primary hover:bg-primary/20 rounded border border-primary/20 transition-all flex items-center gap-1"
                                    >
                                      <Play size={10} fill="currentColor" /> SIMULATE
                                    </button>
                                  )}
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${progress < 50 ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                    {progress < 50 ? 'Critical' : 'High'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                  <span>{progress}%</span>
                                  <div className="flex items-center gap-1">
                                    <History size={10} />
                                    <span>{completedTasks}/{wf.tasks?.length || 0} TASKS</span>
                                  </div>
                                </div>
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Fleet Status */}
                  <div className="space-y-6">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Fleet Status</h3>
                    <div className="space-y-4">
                      {employees.slice(0, 4).map(emp => (
                        <div key={emp.employee_id} className="surface-card p-4">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold truncate">{emp.name}</h4>
                                <span className="text-xs font-mono text-muted-foreground">{emp.current_workload_percent}%</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">{emp.role}</p>
                            </div>
                          </div>
                          <div className="h-1 bg-secondary rounded-full overflow-hidden mb-3">
                            <div 
                              className={`h-full transition-all duration-1000 ${parseInt(emp.current_workload_percent) > 80 ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${emp.current_workload_percent}%` }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {emp.skills.split(',').slice(0, 3).map((skill, si) => (
                              <span key={si} className="px-1.5 py-0.5 bg-secondary text-[9px] font-mono rounded text-muted-foreground">{skill.trim()}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'files' && (
              <motion.div 
                key="files"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-7xl mx-auto h-full flex gap-8"
              >
                {/* Left Sidebar: Uploaded Files */}
                <div className="w-80 flex flex-col gap-6">
                  <div className="surface-card p-6 flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Uploaded Files</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                      {uploadedFiles.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                          <FileText size={48} className="mb-4 opacity-20" />
                          <p className="text-sm opacity-20">No files uploaded</p>
                        </div>
                      ) : (
                        uploadedFiles.map(file => {
                          const isHighlighted = highlightedFiles.includes(file.name);
                          return (
                            <button
                              key={file.id}
                              onClick={() => setSelectedFileId(file.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all border relative ${
                                selectedFileId === file.id 
                                  ? 'bg-primary/10 border-primary/30 text-primary' 
                                  : isHighlighted
                                    ? 'bg-accent/10 border-accent/50 text-accent shadow-[0_0_10px_rgba(0,255,0,0.2)]'
                                    : 'bg-secondary/50 border-transparent hover:border-border text-foreground'
                              }`}
                            >
                              <File size={18} />
                              <div className="text-left overflow-hidden">
                                <p className="text-xs font-bold truncate">{file.name}</p>
                                <p className="text-[10px] opacity-60 uppercase">{file.type.split('/')[1]}</p>
                              </div>
                              {isHighlighted && (
                                <motion.div 
                                  layoutId="highlight-glow"
                                  className="absolute inset-0 rounded-lg border-2 border-accent/50 pointer-events-none"
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Agent Memory in File Tab */}
                  <div className="surface-card p-6 h-64 flex flex-col">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Agent Memory</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      {/* Skills Matrix Well in Memory */}
                      <div className="p-3 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-tighter">
                          <BrainCircuit size={12} />
                          Skills Matrix Well
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(Array.from(new Set(employees.flatMap(e => e.skills.split(';')))) as string[]).slice(0, 12).map((skill, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-background border border-border rounded text-[8px] font-mono text-muted-foreground">
                              {skill.trim()}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {memory.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground text-center py-4">No memory entries</p>
                        ) : (
                          memory.slice(0, 5).map((m, i) => (
                            <div key={i} className="p-2 rounded bg-secondary/50 border border-border/50">
                              <p className="text-[10px] font-bold truncate">{m.project}</p>
                              <p className="text-[8px] text-muted-foreground">{new Date(m.timestamp).toLocaleDateString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Resource Utilization in File Tab */}
                  <div className="surface-card p-6 h-64 flex flex-col">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">Resource Utilization</h3>
                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                      {employees.slice(0, 5).map(emp => (
                        <div key={emp.employee_id}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="font-medium truncate max-w-[100px]">{emp.name}</span>
                            <span className="font-mono text-muted-foreground">{emp.current_workload_percent}%</span>
                          </div>
                          <div className="h-1 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${parseInt(emp.current_workload_percent) > 80 ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${emp.current_workload_percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Main Area: Workflow Initiation + Analysis + Chat */}
                <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                  {/* Initiate New Workflow (Moved here) */}
                  <div className="surface-elevated p-6 relative">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Sparkles className="text-primary" size={20} />
                        <h2 className="text-lg font-bold">Initiate New Workflow</h2>
                      </div>
                      
                      {/* Upload File Option at Top Right */}
                      <label className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-border border border-border rounded-lg cursor-pointer transition-all group">
                        <Upload size={14} className="text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold">Upload Context</span>
                        <input type="file" className="hidden" accept=".csv,.pdf,.txt,.md,.srs,.json" onChange={handleWorkflowFileUpload} />
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="md:col-span-2 p-4 bg-primary/5 border border-primary/20 rounded-xl mb-2">
                        <label className="block text-[10px] font-mono text-primary uppercase tracking-wider mb-2">Quick Project Initiation (Auto-Analyze)</label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={quickProjectName}
                            onChange={(e) => setQuickProjectName(e.target.value)}
                            placeholder="Enter project name (e.g. 'Q1 Marketing Campaign')"
                            className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                          />
                          <button 
                            onClick={handleQuickExecute}
                            disabled={loading || !quickProjectName.trim()}
                            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                          >
                            <Zap size={14} fill="currentColor" />
                            Auto-Start
                          </button>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-2 italic">Agent will automatically analyze requirements, priority, and assignees based on name.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Select Active Project</label>
                        <select 
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                        >
                          <option value="">-- Choose a project --</option>
                          {projects.map(p => (
                            <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <button 
                          onClick={handleRunWorkflow}
                          disabled={loading || !projectRequest.trim()}
                          className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                          {loading ? <Loader2 className="animate-spin" size={14} /> : <Play size={14} fill="currentColor" />}
                          {loading ? 'Orchestrating...' : 'Execute Workflow'}
                        </button>
                        <button 
                          onClick={() => { setSelectedProjectId(''); setProjectRequest(''); setResult(null); }}
                          className="px-3 py-2 bg-secondary hover:bg-border rounded-lg text-muted-foreground transition-all"
                          title="Clear Form"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">Project Context & Requirements</label>
                      <textarea 
                        value={projectRequest}
                        onChange={(e) => setProjectRequest(e.target.value)}
                        placeholder="Describe the project goals..."
                        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs min-h-[80px] focus:ring-2 focus:ring-primary outline-none transition-all resize-none"
                      />
                    </div>
                  </div>

                  {/* Workflow Result Rendering */}
                  <AnimatePresence>
                    {result && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="surface-elevated p-6 space-y-6"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <BrainCircuit className="text-primary" size={20} />
                            <h2 className="text-lg font-bold">Strategic Analysis</h2>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={downloadCSV} className="text-[10px] font-mono px-3 py-1 bg-secondary hover:bg-border rounded border border-border transition-all flex items-center gap-1">
                              <Download size={10} /> CSV
                            </button>
                            <button onClick={downloadPDF} className="text-[10px] font-mono px-3 py-1 bg-secondary hover:bg-border rounded border border-border transition-all flex items-center gap-1">
                              <Download size={10} /> PDF
                            </button>
                            <button onClick={() => setResult(null)} className="text-[10px] font-mono px-3 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded border border-destructive/20 transition-all">Clear</button>
                          </div>
                        </div>
                        
                        <div 
                          className="p-4 bg-secondary/30 rounded-lg border border-border/50 cursor-pointer hover:bg-secondary/40 transition-all group relative"
                          onClick={downloadPDF}
                          title="Click to download as PDF"
                        >
                          <p className="text-sm leading-relaxed text-muted-foreground">{result.analysis}</p>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Download size={14} className="text-primary" />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 size={14} /> Decomposed Tasks
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result?.tasks?.map((task, i) => (
                              <div key={i} className={`surface-card p-4 border-l-4 ${task.priority === 'high' ? 'border-destructive' : task.priority === 'medium' ? 'border-warning' : 'border-primary'} hover:border-opacity-80 transition-all`}>
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-sm">{task.title}</h4>
                                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${task.status === 'completed' ? 'bg-success/10 text-success' : 'bg-primary/10 text-primary'}`}>
                                    {task.status}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono px-2 py-0.5 bg-secondary rounded border border-border">{task.assignedTo}</span>
                                    <span className="text-[8px] font-mono text-muted-foreground uppercase">{task.priority}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {task.tools.slice(0, 2).map((tool, j) => (
                                      <span key={j} className="text-[8px] font-mono text-primary uppercase tracking-tighter">{tool}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* File Analysis & Chat */}
                  {selectedFile ? (
                    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                      {/* Analysis Card */}
                      <div className="surface-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <FileText size={16} />
                            </div>
                            <h2 className="text-md font-bold">File Analysis: {selectedFile.name}</h2>
                          </div>
                          {isAnalyzing && <Loader2 className="animate-spin text-primary" size={16} />}
                        </div>

                        {selectedFile.analysis ? (
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div>
                                <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Project</label>
                                <p className="text-sm font-bold text-primary">{selectedFile.analysis.project}</p>
                              </div>
                              <div>
                                <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Description</label>
                                <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">{selectedFile.analysis.description}</p>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Required Skills</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedFile?.analysis?.requiredSkills?.split(';').map((skill, i) => (
                                    <span key={i} className="px-1.5 py-0.5 bg-secondary text-[9px] font-mono rounded border border-border">{skill}</span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Priority</label>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className={`w-1.5 h-1.5 rounded-full ${selectedFile.analysis.priority === 'hard' ? 'bg-destructive' : selectedFile.analysis.priority === 'medium' ? 'bg-warning' : 'bg-success'}`} />
                                  <span className="text-[11px] font-bold capitalize">{selectedFile.analysis.priority}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center text-center">
                            <Loader2 className="animate-spin text-primary mb-2" size={24} />
                            <p className="text-xs text-muted-foreground">Analyzing file...</p>
                          </div>
                        )}
                      </div>

                      {/* Chat Interface */}
                      <div className="flex-1 surface-card flex flex-col overflow-hidden">
                        <div className="px-6 py-3 border-b border-border flex items-center gap-3 bg-secondary/30">
                          <MessageSquare size={16} className="text-primary" />
                          <h3 className="text-xs font-bold">Query Agent</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          {chatHistory.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                              <BrainCircuit size={40} className="mb-4" />
                              <p className="text-xs">Ask me anything about this file</p>
                            </div>
                          )}
                          {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] p-3 rounded-xl text-xs ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-secondary border border-border rounded-tl-none'}`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                          {isQuerying && (
                            <div className="flex justify-start">
                              <div className="bg-secondary border border-border p-3 rounded-xl rounded-tl-none">
                                <Loader2 className="animate-spin text-primary" size={14} />
                              </div>
                            </div>
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <div className="p-4 border-t border-border bg-secondary/30">
                          <form 
                            onSubmit={(e) => { e.preventDefault(); handleQueryFile(); }}
                            className="relative"
                          >
                            <input 
                              value={query}
                              onChange={(e) => setQuery(e.target.value)}
                              placeholder="Type your query here..."
                              className="w-full bg-background border border-border rounded-xl px-4 py-2.5 pr-12 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                            />
                            <button 
                              type="submit"
                              disabled={isQuerying || !query.trim()}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all"
                            >
                              <Send size={14} />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center surface-card border-dashed">
                      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6">
                        <FileText size={32} className="text-muted-foreground opacity-40" />
                      </div>
                      <h2 className="text-xl font-bold mb-2">No File Selected</h2>
                      <p className="text-sm text-muted-foreground max-w-xs">Select a file from the sidebar to start analysis and querying.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div 
                key="teams"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-7xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Team Directory</h2>
                    <p className="text-sm text-muted-foreground">Real-time performance metrics and skill matrix for all active employees.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                      <input 
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        placeholder="Search team..."
                        className="w-full bg-secondary border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs focus:ring-2 focus:ring-primary outline-none transition-all"
                      />
                    </div>
                    <div className="flex items-center gap-4 bg-secondary/30 px-4 py-2 rounded-xl border border-border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-[10px] font-mono uppercase">On-Time</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-destructive" />
                        <span className="text-[10px] font-mono uppercase">Delayed</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrichedEmployees
                    .filter(emp => emp.name.toLowerCase().includes(teamSearch.toLowerCase()) || emp.role.toLowerCase().includes(teamSearch.toLowerCase()) || emp.skills.toLowerCase().includes(teamSearch.toLowerCase()))
                    .slice(0, 500) // Increased limit to show all 500+ employees
                    .map((emp) => (
                    <div key={emp.employee_id} className="surface-elevated flex flex-col overflow-hidden group hover:border-primary/50 transition-all">
                      {/* Top Performance Ratio Bar */}
                      <div className="h-1.5 w-full flex">
                        <div 
                          className="h-full bg-success transition-all duration-1000" 
                          style={{ width: `${emp.total_tasks_completed ? (emp.completed_on_time! / emp.total_tasks_completed) * 100 : 100}%` }}
                          title="On-Time"
                        />
                        <div 
                          className="h-full bg-destructive transition-all duration-1000" 
                          style={{ width: `${emp.total_tasks_completed ? (emp.delayed! / emp.total_tasks_completed) * 100 : 0}%` }}
                          title="Delayed"
                        />
                      </div>

                      <div className="p-6 space-y-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-bold text-lg text-primary shadow-inner">
                              {emp.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{emp.name}</h3>
                              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{emp.role}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Ratio</div>
                            <div className="text-sm font-bold text-success">
                              {emp.completed_on_time}:{emp.delayed}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                            <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Current Project</div>
                            <p className="text-xs font-bold truncate text-primary">{emp.current_project || 'Idle'}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border/50">
                            <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Task Progress</div>
                            <p className="text-xs font-bold">
                              {emp.total_tasks_completed} <span className="text-muted-foreground font-normal">/ {emp.total_tasks_assigned}</span>
                            </p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-muted-foreground">
                            <span>Skills Matrix</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {emp.skills.split(';').map((skill, si) => (
                              <span key={si} className="px-2 py-0.5 bg-secondary border border-border rounded text-[9px] font-mono text-primary/80">
                                {skill.trim()}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-muted-foreground">
                            <span>Workload</span>
                            <span>{emp.current_workload_percent}%</span>
                          </div>
                          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${parseInt(emp.current_workload_percent) > 80 ? 'bg-destructive' : 'bg-primary'}`}
                              style={{ width: `${emp.current_workload_percent}%` }}
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="w-full py-2.5 rounded-lg bg-primary/5 border border-primary/20 text-[10px] font-bold flex items-center justify-center gap-2 text-primary">
                            <BrainCircuit size={14} />
                            Active Intelligence Node
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'data' && (
              <motion.div 
                key="data"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight">Resource Management</h2>
                    <p className="text-sm text-muted-foreground">Centralized repository for employees, tools, and historical project data.</p>
                  </div>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      value={dataSearch}
                      onChange={(e) => setDataSearch(e.target.value)}
                      placeholder="Search resources..."
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="surface-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2"><Users size={16} /> Employees</h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{employees.length} TOTAL</span>
                    </div>
                    <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                      {employees
                        .filter(emp => emp.name.toLowerCase().includes(dataSearch.toLowerCase()) || emp.role.toLowerCase().includes(dataSearch.toLowerCase()) || emp.skills.toLowerCase().includes(dataSearch.toLowerCase()))
                        .map(emp => (
                          <div key={emp.employee_id} className="p-4 hover:bg-secondary/50 transition-all flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold">{emp.name}</p>
                              <p className="text-xs text-muted-foreground">{emp.role}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-mono text-muted-foreground uppercase">{emp.skills.split(';')[0]}</p>
                              <p className={`text-xs font-bold ${parseInt(emp.current_workload_percent) > 80 ? 'text-destructive' : 'text-success'}`}>{emp.current_workload_percent}%</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="surface-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2"><Wrench size={16} /> Tools</h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{tools.length} TOTAL</span>
                    </div>
                    <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                      {tools
                        .filter(tool => tool.tool_name.toLowerCase().includes(dataSearch.toLowerCase()) || tool.tool_type.toLowerCase().includes(dataSearch.toLowerCase()) || tool.purpose.toLowerCase().includes(dataSearch.toLowerCase()))
                        .map(tool => (
                          <div key={tool.tool_id} className="p-4 hover:bg-secondary/50 transition-all">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-bold">{tool.tool_name}</p>
                              <span className="px-2 py-0.5 bg-primary/10 text-[10px] font-mono text-primary rounded">{tool.tool_type}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{tool.purpose}</p>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="surface-card overflow-hidden md:col-span-2">
                    <div className="px-6 py-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                      <h3 className="text-sm font-bold flex items-center gap-2"><History size={16} /> Project History</h3>
                      <span className="text-[10px] font-mono text-muted-foreground">{projectHistory.length} TOTAL</span>
                    </div>
                    <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                      {projectHistory.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-xs italic">No history data available.</div>
                      ) : (
                        projectHistory
                          .filter(hist => hist.project_name.toLowerCase().includes(dataSearch.toLowerCase()) || hist.tools_used.toLowerCase().includes(dataSearch.toLowerCase()))
                          .map((hist, i) => (
                            <div key={i} className="p-4 hover:bg-secondary/50 transition-all flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold">{hist.project_name}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{hist.tools_used}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] font-mono text-muted-foreground uppercase">Score: {hist.success_score || 'N/A'}</p>
                                <p className="text-xs font-bold text-primary">{hist.completion_days || '?' } Days</p>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-6xl mx-auto space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Activity History</h2>
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input 
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      placeholder="Search history..."
                      className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Play size={14} /> Workflow Executions
                    </h3>
                    <div className="space-y-4">
                      {workflowHistory
                        .filter(w => w.project.toLowerCase().includes(historySearch.toLowerCase()) || w.analysis.toLowerCase().includes(historySearch.toLowerCase()))
                        .map((w, i) => (
                          <div key={i} className="surface-card p-6 hover:border-primary/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-primary">{w.project}</h4>
                              <span className="text-[10px] font-mono text-muted-foreground">{w.timestamp?.toDate().toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{w.analysis}</p>
                            <div className="flex flex-wrap gap-2">
                              {w.tasks?.slice(0, 3).map((t: any, j: number) => (
                                <span key={j} className="px-2 py-0.5 bg-secondary text-[10px] font-mono rounded border border-border">{t.assignedTo}</span>
                              ))}
                              {w.tasks.length > 3 && <span className="text-[10px] text-muted-foreground">+{w.tasks.length - 3} more</span>}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <History size={14} /> Historical Projects
                    </h3>
                    <div className="space-y-4">
                      {projectHistory
                        .filter(h => h.project_name.toLowerCase().includes(historySearch.toLowerCase()) || h.tools_used.toLowerCase().includes(historySearch.toLowerCase()))
                        .map((h, i) => (
                          <div key={i} className="surface-card p-6 hover:border-primary/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-foreground">{h.project_name}</h4>
                              <span className="text-[10px] font-mono text-muted-foreground">Score: {h.success_score}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">{h.outcome || 'Completed successfully'}</p>
                            <div className="flex flex-wrap gap-1">
                              {h.tools_used?.split(';').map((tool: string, j: number) => (
                                <span key={j} className="px-1.5 py-0.5 bg-primary/5 text-primary text-[9px] font-mono rounded">{tool.trim()}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} /> File Queries
                    </h3>
                    <div className="space-y-4">
                      {queryHistory
                        .filter(q => q.query.toLowerCase().includes(historySearch.toLowerCase()) || q.answer.toLowerCase().includes(historySearch.toLowerCase()) || q.fileName.toLowerCase().includes(historySearch.toLowerCase()))
                        .map((q, i) => (
                          <div key={i} className="surface-card p-6 hover:border-primary/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <File size={14} className="text-muted-foreground" />
                                <h4 className="font-bold text-foreground">{q.fileName}</h4>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground">{q.timestamp?.toDate().toLocaleString()}</span>
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-primary">Q: {q.query}</p>
                              <p className="text-xs text-muted-foreground line-clamp-3">A: {q.answer}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
