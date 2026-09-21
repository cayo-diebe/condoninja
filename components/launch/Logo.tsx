import Image from "next/image";

export function Logo() {
  return <span className="marketing-logo">
    <Image src="/condo-brand-transparent.png" alt="" width={38} height={44} sizes="38px" />
    <span>Condo Ninja</span>
  </span>;
}
