type LoadingProps = {
  type?: string;
  width?: number | string;
  height?: number | string;
  color?: string;
};

export default function Loading({
  width = 40,
  height = 40,
  color = '#1DBE67',
}: LoadingProps) {
  return (
    <div
      aria-hidden="true"
      className="animate-spin rounded-full border-4 border-green-100"
      style={{ width, height, borderTopColor: color }}
    />
  );
}
