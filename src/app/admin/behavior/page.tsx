"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";
import { playClick } from "@/lib/sounds";

interface Student { id: number; name: string; rollNumber: number; profilePicture: string; }
interface Behavior { studentId: number; punctuality: number; discipline: number; participation: number; homework: number; teamwork: number; creativity: number; }
interface Comment { id: number; studentId: number; teacherName: string; teacherSubject: string; comment: string; type: string; createdAt: string; }

export default function BehaviorPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [behavior, setBehavior] = useState<Behavior>({ studentId: 0, punctuality: 70, discipline: 70, participation: 70, homework: 70, teamwork: 70, creativity: 70 });
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [teacherSubject, setTeacherSubject] = useState("");
  const [commentType, setCommentType] = useState("positive");
  const [loading, setLoading] = useState(false);

  const loadStudents = useCallback(() => {
    fetch("/api/students").then(r => r.json()).then(d => setStudents(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/behaviors?studentId=${selectedId}`).then(r => r.json()),
      fetch(`/api/comments?studentId=${selectedId}`).then(r => r.json()),
    ]).then(([b, c]) => {
      if (b) setBehavior(b);
      else setBehavior({ studentId: selectedId, punctuality: 70, discipline: 70, participation: 70, homework: 70, teamwork: 70, creativity: 70 });
      setComments(Array.isArray(c) ? c : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedId]);

  const saveBehavior = async () => {
    playClick();
    const res = await fetch("/api/behaviors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(behavior) });
    if (res.ok) toast("Behavior saved!", "success"); else toast("Failed", "error");
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !teacherName || !selectedId) return;
    const res = await fetch("/api/comments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selectedId, teacherName, teacherSubject, comment: commentText, type: commentType }),
    });
    if (res.ok) {
      toast("Comment added", "success");
      setCommentText("");
      fetch(`/api/comments?studentId=${selectedId}`).then(r => r.json()).then(d => setComments(Array.isArray(d) ? d : []));
    }
  };

  const deleteComment = async (id: number) => {
    if (!confirm("Delete comment?")) return;
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    setComments(prev => prev.filter(c => c.id !== id));
    toast("Deleted", "success");
  };

  const selectedStudent = students.find(s => s.id === selectedId);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-charcoal">Student Behavior & Comments</h1>
        <p className="text-sm text-muted">Manage tier-boosting behavior scores and teacher feedback</p>
      </div>

      {/* Student Selector */}
      <div className="liquid-glass rounded-2xl p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {students.map(s => (
            <button key={s.id} onClick={() => { setSelectedId(s.id); playClick(); }}
              className={`p-3 rounded-2xl text-left transition-all flex items-center gap-2 ${selectedId === s.id ? "gradient-royal text-white shadow-lg" : "liquid-glass-sm hover:bg-white/50"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selectedId === s.id ? "bg-white/20 text-white" : "gradient-royal text-white"}`}>{s.name.charAt(0)}</div>
              <div className="min-w-0"><p className="text-xs font-semibold truncate">{s.name}</p><p className={`text-[10px] ${selectedId === s.id ? "text-white/70" : "text-muted"}`}>Roll {s.rollNumber}</p></div>
            </button>
          ))}
        </div>
      </div>

      {!selectedId ? (
        <div className="liquid-glass-strong rounded-3xl p-16 text-center"><p className="text-muted">Select a student to manage behavior & comments</p></div>
      ) : loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl skeleton" />)}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Behavior Sliders */}
          <div className="liquid-glass-strong rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <span className="text-xl">📊</span> Behavior Scores
              </h3>
              <div className="flex items-center gap-2">
                {selectedStudent && <span className="text-sm font-semibold text-charcoal">{selectedStudent.name}</span>}
              </div>
            </div>

            <div className="space-y-5">
              {[
                { key: "punctuality", label: "Punctuality", icon: "⏰", desc: "On-time attendance" },
                { key: "discipline", label: "Discipline", icon: "🎯", desc: "Rules & conduct" },
                { key: "participation", label: "Participation", icon: "🙋", desc: "Class activity" },
                { key: "homework", label: "Homework", icon: "📚", desc: "Assignment completion" },
                { key: "teamwork", label: "Teamwork", icon: "🤝", desc: "Collaboration" },
                { key: "creativity", label: "Creativity", icon: "🎨", desc: "Innovative thinking" },
              ].map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-charcoal flex items-center gap-2">
                      <span>{item.icon}</span> {item.label}
                      <span className="text-[10px] text-muted hidden sm:inline">— {item.desc}</span>
                    </span>
                    <span className="text-xs font-bold px-2 py-1 rounded-lg bg-royal/10 text-royal">{(behavior as unknown as Record<string, number>)[item.key]}%</span>
                  </div>
                  <input type="range" min="0" max="100" value={(behavior as unknown as Record<string, number>)[item.key]}
                    onChange={(e) => setBehavior({ ...behavior, [item.key]: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/40 rounded-full appearance-none cursor-pointer accent-royal" />
                </div>
              ))}
            </div>

            <button onClick={saveBehavior} className="w-full mt-6 gradient-royal text-white py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-royal/20">
              💾 Save Behavior
            </button>

            {/* Preview */}
            <div className="mt-6 liquid-glass-sm rounded-2xl p-4">
              <p className="text-xs font-semibold text-muted mb-2">Average Behavior</p>
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black text-charcoal">{Math.round((behavior.punctuality + behavior.discipline + behavior.participation + behavior.homework + behavior.teamwork + behavior.creativity)/6)}%</div>
                <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-royal to-emerald rounded-full transition-all" style={{ width: `${Math.round((behavior.punctuality + behavior.discipline + behavior.participation + behavior.homework + behavior.teamwork + behavior.creativity)/6)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="liquid-glass-strong rounded-3xl p-6 flex flex-col">
            <h3 className="text-lg font-bold text-charcoal mb-5 flex items-center gap-2">
              <span className="text-xl">💬</span> Teacher Comments
            </h3>

            <form onSubmit={addComment} className="space-y-3 mb-6">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Teacher name" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="px-4 py-2.5 rounded-xl border border-white/40 bg-white/40 text-sm" required />
                <input type="text" placeholder="Subject (optional)" value={teacherSubject} onChange={e => setTeacherSubject(e.target.value)} className="px-4 py-2.5 rounded-xl border border-white/40 bg-white/40 text-sm" />
              </div>
              <select value={commentType} onChange={e => setCommentType(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white/40 text-sm">
                <option value="positive">🌟 Positive</option><option value="advice">💡 Advice</option><option value="neutral">📝 Neutral</option>
              </select>
              <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write feedback..." rows={3} className="w-full px-4 py-3 rounded-xl border border-white/40 bg-white/40 text-sm resize-none" required />
              <button type="submit" className="w-full bg-charcoal text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-charcoal/90">+ Add Comment</button>
            </form>

            <div className="flex-1 space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-hide">
              {comments.length === 0 ? <p className="text-center text-muted text-sm py-8">No comments yet</p> :
                comments.map(c => (
                  <div key={c.id} className={`rounded-2xl p-4 border ${c.type === "positive" ? "bg-emerald/5 border-emerald/10" : c.type === "advice" ? "bg-amber/5 border-amber/10" : "bg-white/30 border-white/20"}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-charcoal">{c.teacherName} {c.teacherSubject && <span className="text-xs text-muted">— {c.teacherSubject}</span>}</p>
                        <p className="text-sm text-charcoal/80 mt-1">{c.comment}</p>
                        <p className="text-[10px] text-muted mt-2">{new Date(c.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => deleteComment(c.id)} className="p-1.5 rounded-lg bg-crimson/10 text-crimson hover:bg-crimson/20"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
