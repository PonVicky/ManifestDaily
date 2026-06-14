// md-main.jsx — assembles the full design canvas.

const SCREEN_W = 393, SCREEN_H = 852;
function Screen({ children, bg }) { return <div className="md md-screen" style={{ background:bg||'var(--md-bg)' }}>{children}</div>; }
const ab = (w, h, bg='var(--md-bg)') => ({ width:w, height:h, style:{ background:bg, borderRadius:0 } });
const board = ab(SCREEN_W, SCREEN_H);

function StaticHome({ goal='confidence', idx=0 }) {
  const a = (MD_AFFIRMATIONS[goal]||MD_AFFIRMATIONS.confidence)[idx];
  return <Screen><HomeScreen goal={goal} affirmation={a} streak={12} onBreathe={()=>{}} onFocus={()=>{}} onNewAffirmation={()=>{}} /><TabBar active="home"/><HomeIndicator/></Screen>;
}

function Canvas() {
  return (
    <DesignCanvas>
      <DCSection id="proto" title="Live Prototype" subtitle="Fully clickable — tap cards, switch tabs, run a focus session, open breathing. Theme control (top-right) flips light/dark across every frame.">
        <DCArtboard id="app-onb" label="From onboarding" {...board}><AppShell start="onboarding" /></DCArtboard>
        <DCArtboard id="app-home" label="From home" {...board}><AppShell start="app" /></DCArtboard>
        <DCPostIt top={-8} right={-150} rotate={2} width={150}>Tip: tap the affirmation to swap it · Nimbus, your cloud, follows you through the app</DCPostIt>
      </DCSection>

      <DCSection id="onboarding" title="Onboarding" subtitle="Seven screens — welcome through first affirmation, paywall, and entry.">
        {[['ob1','01 · Welcome'],['ob2','02 · Goal'],['ob3','03 · Reminders'],['ob4','04 · Notifications'],['ob5','05 · First affirmation'],['ob6','06 · Paywall'],['ob7','07 · Enter app']].map(([id,label],i)=>(
          <DCArtboard key={id} id={id} label={label} {...board}><Screen><OnboardingFlow startStep={i} onDone={()=>{}} /></Screen></DCArtboard>
        ))}
      </DCSection>

      <DCSection id="core" title="Core Screens" subtitle="The three tabs plus the two focus states.">
        <DCArtboard id="c-home" label="Home" {...board}><StaticHome /></DCArtboard>
        <DCArtboard id="c-focus" label="Focus · setup" {...board}><Screen><FocusScreen onStartRun={()=>{}} /><TabBar active="focus"/><HomeIndicator/></Screen></DCArtboard>
        <DCArtboard id="c-run" label="Focus · running" {...board}><Screen><FocusRunScreen minutes={25} sound="rain" demo demoProgress={0.36} onEnd={()=>{}} /></Screen></DCArtboard>
        <DCArtboard id="c-breathe" label="Breathing reset" {...board}><Screen><BreathingScreen demo onClose={()=>{}} /></Screen></DCArtboard>
        <DCArtboard id="c-prog" label="Progress" {...board}><Screen><ProgressScreen /><TabBar active="progress"/><HomeIndicator/></Screen></DCArtboard>
      </DCSection>

      <DCSection id="v-aff" title="Variations · Affirmation Card" subtitle="The emotional centerpiece, three directions — visual style + interaction.">
        <DCArtboard id="aff-a" label="A · Classic card" {...ab(393,420)}><AffCardA/></DCArtboard>
        <DCArtboard id="aff-b" label="B · Editorial" {...ab(393,420)}><AffCardB/></DCArtboard>
        <DCArtboard id="aff-c" label="C · Halo & deck" {...ab(393,420)}><AffCardC/></DCArtboard>
      </DCSection>

      <DCSection id="v-home" title="Variations · Home Layout" subtitle="Same content, three compositions.">
        <DCArtboard id="home-a" label="A · Card stack" {...board}><StaticHome/></DCArtboard>
        <DCArtboard id="home-b" label="B · Hero affirmation" {...board}><HomeHero/></DCArtboard>
        <DCArtboard id="home-c" label="C · Minimal list" {...board}><HomeMinimal/></DCArtboard>
      </DCSection>

      <DCSection id="v-pay" title="Variations · Paywall" subtitle="Premium, never pushy. No fake countdowns.">
        <DCArtboard id="pay-a" label="A · Plans grid" {...board}><Screen><Paywall onContinue={()=>{}} onClose={()=>{}} /></Screen></DCArtboard>
        <DCArtboard id="pay-b" label="B · Single focus" {...board}><PaywallB/></DCArtboard>
      </DCSection>

      <DCSection id="v-onb" title="Variations · Onboarding Style" subtitle="Two welcome treatments — soft-centered vs editorial.">
        <DCArtboard id="onb-a" label="A · Soft centered" {...board}><Screen><OnboardingFlow startStep={0} onDone={()=>{}} /></Screen></DCArtboard>
        <DCArtboard id="onb-b" label="B · Editorial" {...board}><OnbWelcomeEditorial/></DCArtboard>
      </DCSection>

      <DCSection id="v-breathe" title="Variations · Breathing Animation" subtitle="Live — three motion metaphors for the 4-4-4 cycle.">
        <DCArtboard id="br-a" label="A · Concentric rings" {...ab(393,460)}><BreatheA/></DCArtboard>
        <DCArtboard id="br-b" label="B · Filling orb" {...ab(393,460)}><BreatheB/></DCArtboard>
        <DCArtboard id="br-c" label="C · Morphing blob" {...ab(393,460)}><BreatheC/></DCArtboard>
      </DCSection>

      <DCSection id="v-cal" title="Variations · Activity Calendar" subtitle="Consistency, three visualizations. Tap heatmap cells to toggle.">
        <DCArtboard id="cal-a" label="A · Heatmap" {...ab(393,300)}><CalA/></DCArtboard>
        <DCArtboard id="cal-b" label="B · Month dots" {...ab(393,360)}><CalB/></DCArtboard>
        <DCArtboard id="cal-c" label="C · Weekly bars" {...ab(393,300)}><CalC/></DCArtboard>
      </DCSection>

      <DCSection id="widgets-home" title="Widgets · Home Screen" subtitle="Small, medium, large.">
        <DCArtboard id="w-s" label="Small · affirmation" {...ab(230,230,'transparent')}><WidgetSmall/></DCArtboard>
        <DCArtboard id="w-m" label="Medium · + streak" {...ab(410,230,'transparent')}><WidgetMedium/></DCArtboard>
        <DCArtboard id="w-l" label="Large · goal + actions" {...ab(410,420,'transparent')}><WidgetLarge/></DCArtboard>
      </DCSection>

      <DCSection id="widgets-lock" title="Widgets · Lock Screen" subtitle="Circular streak, focus minutes, quick start.">
        <DCArtboard id="w-c" label="Circular · streak" {...ab(250,250,'transparent')}><LockCircular/></DCArtboard>
        <DCArtboard id="w-r" label="Rectangular · focus" {...ab(340,230,'transparent')}><LockRect/></DCArtboard>
        <DCArtboard id="w-a" label="Quick action · start" {...ab(250,250,'transparent')}><LockAction/></DCArtboard>
      </DCSection>

      <DCSection id="ds" title="Design System" subtitle="Color, type, and components. Toggle the theme to see both palettes live.">
        <DCArtboard id="ds-color" label="Color" {...ab(760,640,'var(--md-card)')}><DSColors/></DCArtboard>
        <DCArtboard id="ds-type" label="Typography" {...ab(720,520,'var(--md-card)')}><DSType/></DCArtboard>
        <DCArtboard id="ds-comp" label="Components" {...ab(760,560,'var(--md-card)')}><DSComponents/></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<><GlobalControls /><Canvas /></>);
