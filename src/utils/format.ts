export const truncateAddress = (address: string, maxLength: number = 24): string => {
  if (!address) return '';
  if (address.length <= maxLength) return address;
  return `${address.slice(0, maxLength)}...`;
};