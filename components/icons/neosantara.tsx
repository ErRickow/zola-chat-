type LogoProps = React.ImgHTMLAttributes < HTMLImageElement > ;

export function NeosantaraLogo(props: LogoProps) {
  return (
    <img
      src="/neosantara-logo.svg"
      alt="Neosantara Logo"
      width="64"
      height="64"
      {...props}
    />
  );
}