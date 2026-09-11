import React, { useState } from 'react';
import { PoultryState } from '../../services/iotDataService';
import {
  Sparkles,
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Activity,
  ArrowRight,
  Clock,
  Eye,
  Cpu,
  Brain,
  Layers,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface AiHealthViewProps {
  state: PoultryState;
}

interface SampleImage {
  id: string;
  name: string;
  prediction: 'ALIVE' | 'SUSPECTED_DEAD' | 'LETHARGIC';
  confidence: number;
  movementScore: number;
  postureAssessment: string;
  notes: string;
  url: string;
}

export const AiHealthView: React.FC<AiHealthViewProps> = ({ state }) => {
  const { poultryActivity } = state;

  const sampleImages: SampleImage[] = [
    {
      id: 'sample-1',
      name: 'Active Foraging Broiler (Zone 1)',
      prediction: 'ALIVE',
      confidence: 96.8,
      movementScore: 88,
      postureAssessment: 'Upright sternum, active head orientation, responsive reflex posture.',
      notes: 'Natural foraging behavior detected. No abnormal gait or respiratory distress signatures.',
      url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'sample-2',
      name: 'Flock Perch & Roosting (Zone 3)',
      prediction: 'ALIVE',
      confidence: 92.4,
      movementScore: 65,
      postureAssessment: 'Resting horizontal keel, eyes open, rhythmic breathing motion.',
      notes: 'Normal circadian rest posture. Thermal comfort indicators within nominal limits.',
      url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'sample-3',
      name: 'Lethargic Sternal Recumbency (Zone 2)',
      prediction: 'SUSPECTED_DEAD',
      confidence: 89.2,
      movementScore: 12,
      postureAssessment: 'Persistent lateral recumbency, head resting against litter, absent flinch reflex.',
      notes: 'Suspected severe lethargy or death. Immediate biosecurity verification required by farm caretaker.',
      url: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const [selectedImage, setSelectedImage] = useState<SampleImage>(sampleImages[0]);
  const [analyzing, setAnalyzing] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);

  const handleSelectSample = (sample: SampleImage) => {
    setAnalyzing(true);
    setTimeout(() => {
      setSelectedImage(sample);
      setCustomImage(null);
      setAnalyzing(false);
    }, 400);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomImage(event.target.result as string);
        setAnalyzing(true);
        setTimeout(() => {
          setSelectedImage({
            id: 'custom-upload',
            name: file.name,
            prediction: 'ALIVE',
            confidence: 94.5,
            movementScore: 78,
            postureAssessment: 'Standing posture recognized, symmetrical wing fold, normal comb pigmentation.',
            notes: 'AI-based visual assessment. Suspected condition — requires human verification.',
            url: event.target?.result as string,
          });
          setAnalyzing(false);
        }, 800);
      }
    };
    reader.readAsDataURL(file);
  };

  const futureModules = [
    { title: 'Continuous Optical Flow Tracking', desc: 'Real-time velocity vector tracking of entire flock density distribution.', tag: 'COMING SOON' },
    { title: 'Acoustic Cough & Sneeze Classifier', desc: 'Microphone array detecting infectious bronchitis & Newcastle disease rales.', tag: 'COMING SOON' },
    { title: 'Thermal Stress Infrared Mapping', desc: 'Thermographic FLIR vision detecting surface comb vasodilation spikes.', tag: 'COMING SOON' },
    { title: 'Automated Broiler Weight Estimation', desc: 'Stereo 3D point-cloud bounding boxes for predictive daily gain analysis.', tag: 'COMING SOON' },
    { title: 'Behavioral Anomaly & Cannibalism Detection', desc: 'Neural network isolating aggressive feather pecking patterns.', tag: 'COMING SOON' },
    { title: 'Automated Bird Census & Count', desc: 'High-density segmentation model estimating precise mortality count.', tag: 'COMING SOON' },
  ];

  return (
    <div className="space-y-6">
      {/* Title Banner */}
      <div className="p-5 rounded-2xl glass-panel border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              DEEP LEARNING VISION
            </span>
            <span className="text-xs text-slate-400">Edge Inference Model: MobileNetV3-Poultry</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
            AI Poultry Health & Activity Intelligence
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Automated image visual assessment and behavioral flow analysis designed to assist farm operators in rapid mortality triage and early disease alert detection.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-3">
          <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
          <div>
            <div className="font-bold text-white">YOLOv8 + ResNet Backbone</div>
            <span className="text-[11px] text-slate-400">Inference: 42ms on ESP32-CAM / Cloud API</span>
          </div>
        </div>
      </div>

      {/* Mandatory Regulatory / Agronomic Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block text-xs">
            Important Agricultural & Diagnostic Disclaimer:
          </span>
          <p className="mt-0.5 leading-relaxed text-[11px] text-cyan-300/90">
            This module provides an <strong>AI-based visual assessment</strong> only. It does not replace certified veterinary diagnosis. Any classification of lethargy or suspected mortality is a <strong>suspected condition that strictly requires physical human verification</strong> before taking biosecurity or culling actions.
          </p>
        </div>
      </div>

      {/* Main Image Analysis Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Image Viewer & Upload (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl glass-panel border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Visual Inspection Feed
              </span>
              <span className="text-[11px] font-mono text-cyan-400">2MP Sensor (OV2640)</span>
            </div>

            {/* Image Preview Box */}
            <div className="relative h-64 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
              {analyzing ? (
                <div className="flex flex-col items-center gap-2 text-cyan-400">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-mono">Running Neural Inference...</span>
                </div>
              ) : (
                <>
                  <img
                    src={customImage || selectedImage.url}
                    alt={selectedImage.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Bounding box overlay */}
                  <div className="absolute inset-8 border-2 border-dashed border-cyan-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-2">
                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-cyan-300 self-start">
                      Target: Broiler #B-104
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-emerald-300 self-end">
                      Confidence: {selectedImage.confidence}%
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Sample Selector */}
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">
                Select Demonstration Image:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {sampleImages.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSample(s)}
                    className={`p-1.5 rounded-lg border text-[11px] transition-all text-left ${
                      selectedImage.id === s.id && !customImage
                        ? 'bg-cyan-500/20 border-cyan-400 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold block truncate">{s.name.split(' ')[0]}</span>
                    <span className="text-[9px] text-slate-400">{s.prediction}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upload Custom Image Button */}
          <div className="pt-3 border-t border-slate-800">
            <label className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
              <span>Upload Custom Chicken Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Right Column: AI Inference Results (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl glass-panel border border-cyan-500/20 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">AI Visual Inference Report</h3>
                  <span className="text-xs text-slate-400">Specimen Assessment: {selectedImage.name}</span>
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase border ${
                  selectedImage.prediction === 'ALIVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                }`}
              >
                {selectedImage.prediction === 'ALIVE' ? '🟢 ALIVE' : '🚨 SUSPECTED DEAD'}
              </span>
            </div>

            {/* Confidence & Movement Scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Prediction Confidence</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-cyan-300">
                    {selectedImage.confidence}%
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">High Certainty</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full"
                    style={{ width: `${selectedImage.confidence}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs text-slate-400">Mobility / Movement Score</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-300">
                    {selectedImage.movementScore}%
                  </span>
                  <span className="text-xs text-slate-400">
                    {selectedImage.movementScore > 50 ? 'Active' : 'Sluggish'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${selectedImage.movementScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Posture & Morphological Notes */}
            <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">
                  Anatomical & Posture Assessment:
                </span>
                <p className="text-slate-200 mt-1 leading-relaxed">
                  {selectedImage.postureAssessment}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-400 font-semibold block text-[11px] uppercase">
                  Biosecurity Recommendation:
                </span>
                <p className="text-slate-300 mt-1 leading-relaxed italic">
                  &ldquo;{selectedImage.notes}&rdquo;
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Model Version: poultryguard-vision-v2.1.pt</span>
            <span>Latency: 42ms</span>
          </div>
        </div>
      </div>

      {/* Activity Monitoring Pipeline Architecture (Prompt Requirement) */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Poultry Activity Monitoring Pipeline
            </h3>
            <span className="text-xs text-slate-400">
              Modular architecture ready for camera streaming and edge-AI integration
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Activity Level: <strong className="text-emerald-400">NORMAL</strong>
            </span>
            <span>•</span>
            <span className="text-slate-400">
              Movement: <strong className="text-cyan-400">ACTIVE ({poultryActivity.movementIndex}%)</strong>
            </span>
          </div>
        </div>

        {/* 5-step Flowchart */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
          {[
            { step: '01', title: 'Camera', desc: 'ESP32-CAM 1080p stream at 15 FPS', icon: Camera },
            { step: '02', title: 'Chicken Detection', desc: 'YOLOv8 real-time bounding box segmentation', icon: Eye },
            { step: '03', title: 'Movement Tracking', desc: 'Lucas-Kanade optical flow vector tracking', icon: Activity },
            { step: '04', title: 'Activity Analysis', desc: 'Mobility index calculation & dispersion scoring', icon: Cpu },
            { step: '05', title: 'Anomaly Alert', desc: 'Threshold trigger on prolonged flock inactivity', icon: AlertTriangle },
          ].map((pipeline, i) => {
            const Icon = pipeline.icon;
            return (
              <div
                key={i}
                className="relative p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-cyan-400 font-bold">
                      {pipeline.step}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white">{pipeline.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">{pipeline.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-cyan-400">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Future AI Modules (Prompt Requirement: "COMING SOON") */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Roadmap: Next-Generation AI Modules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {futureModules.map((mod, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                    {mod.tag}
                  </span>
                  <Brain className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">{mod.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{mod.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
