import Link from 'next/link';
import Icon from './Icon';
export default function Brand() {
  return <Link href="/" className="brand" aria-label="SmartSurplus home"><span className="brand-mark"><Icon name="leaf" width="24" height="24" /></span><span><strong>Smart</strong>Surplus<span className="brand-dot">.</span></span></Link>;
}
