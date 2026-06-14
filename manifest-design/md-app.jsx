// md-app.jsx — Full interactive app shell. Onboarding → main tabs → overlays.

function AppShell({ start='onboarding' }) {
  const [mode,setMode] = React.useState(start);      // 'onboarding' | 'app'
  const [tab,setTab] = React.useState('home');
  const [goal,setGoal] = React.useState('confidence');
  const [overlay,setOverlay] = React.useState(null); // null | 'breathe' | {focus:{min,snd}}
  const [affIdx,setAffIdx] = React.useState(0);
  useTheme();

  const affList = MD_AFFIRMATIONS[goal] || MD_AFFIRMATIONS.confidence;
  const affirmation = affList[affIdx % affList.length];

  const enter = (g)=>{ if(g) setGoal(g); setMode('app'); setTab('home'); };

  return (
    <div className="md md-screen">
      {mode==='onboarding'
        ? <OnboardingFlow onDone={enter} />
        : <>
            {tab==='home' && <HomeScreen goal={goal} affirmation={affirmation}
              onBreathe={()=>setOverlay('breathe')} onFocus={()=>setTab('focus')}
              onNewAffirmation={()=>setAffIdx(i=>i+1)} />}
            {tab==='focus' && <FocusScreen onStartRun={(min,snd)=>setOverlay({focus:{min,snd}})} />}
            {tab==='progress' && <ProgressScreen />}
            <TabBar active={tab} onChange={setTab} />
            <HomeIndicator />
          </>
      }
      {overlay==='breathe' && <BreathingScreen onClose={()=>setOverlay(null)} />}
      {overlay && overlay.focus && <FocusRunScreen minutes={overlay.focus.min} sound={overlay.focus.snd}
        onEnd={()=>setOverlay(null)} onComplete={()=>{ setOverlay(null); setTab('progress'); }} />}
    </div>
  );
}

// Floating global controls (theme + accent + reset), fixed outside canvas world.
function GlobalControls() {
  const { dark } = useTheme();
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10, fontFamily:'DM Sans,sans-serif' }}>
      <div style={{ display:'flex', gap:8, alignItems:'center', background:'rgba(255,255,255,.92)', backdropFilter:'blur(12px)', padding:'7px 7px 7px 13px', borderRadius:16, boxShadow:'0 6px 24px rgba(0,0,0,.16), 0 0 0 1px rgba(0,0,0,.04)' }}>
        <span style={{ fontSize:12.5, fontWeight:500, color:'#3A3028', letterSpacing:.2 }}>{dark?'Cream · Dark':'Cream Serenity'}</span>
        <button onClick={()=>MDTheme.toggle()} title="Toggle theme" style={btn(dark)}>
          <Icon name={dark?'sun':'moon'} size={19} style={{ color:'#3A3028' }} />
        </button>
      </div>
      <div style={{ fontSize:11, color:'rgba(60,50,40,.6)', background:'rgba(255,255,255,.8)', padding:'4px 9px', borderRadius:10 }}>Theme affects every frame</div>
    </div>
  );
  function btn(active){ return { width:34, height:34, borderRadius:11, border:'none', cursor:'pointer', background:'rgba(0,0,0,.05)', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }; }
}

Object.assign(window, { AppShell, GlobalControls });
