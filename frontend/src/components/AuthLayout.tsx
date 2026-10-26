import Link from 'next/link';
import Brand from './Brand';
import Icon from './Icon';
export default function AuthLayout({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return <div className="auth-page"><aside className="auth-story"><Brand /><div className="auth-story-content"><p className="eyebrow">Good food. Shared purpose.</p><h2>A better journey<br />starts with<br />a better plan.</h2><p>Connect the food you prepare with the communities that can put it to good use.</p><div className="auth-steps"><div className="auth-step"><span>01</span>Record preparation and demand history</div><div className="auth-step"><span>02</span>Understand possible surplus</div><div className="auth-step"><span>03</span>Coordinate with community partners</div></div></div><p className="auth-story-footer">SmartSurplus · Food surplus planning & redistribution</p></aside><main id="main-content" className="auth-main"><div className={`auth-form-wrap ${wide ? 'wide' : ''}`}><Link href="/" className="auth-back"><Icon name="arrow" /> Back to home</Link>{children}</div></main></div>;
}
