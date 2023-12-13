import React from 'react';
import { SvgIcon } from '../components/svgicon';

interface IconProps {
  size?: string;
}

export default function AuditsIcon({ size }: IconProps) {
  return (
    <SvgIcon viewBox="0 0 25 25" style={size ? { fontSize: size } : {}}>
      <path d="M11.9999 23.26C10.9099 23.26 9.82992 22.9399 8.97992 22.3099L4.6799 19.0999C3.5399 18.2499 2.6499 16.4799 2.6499 15.0599V7.62995C2.6499 6.08995 3.77992 4.44995 5.22992 3.90995L10.2199 2.03995C11.2099 1.66995 12.7699 1.66995 13.7599 2.03995L18.7599 3.90995C20.2099 4.44995 21.3399 6.08995 21.3399 7.62995V15.0599C21.3399 16.4799 20.4499 18.2499 19.3099 19.0999L15.0099 22.3099C14.1699 22.9399 13.0899 23.26 11.9999 23.26ZM10.7499 3.43995L5.75992 5.30994C4.89992 5.62994 4.1499 6.70995 4.1499 7.62995V15.0599C4.1499 16.0099 4.81992 17.3399 5.56992 17.8999L9.8699 21.1099C11.0199 21.9699 12.9699 21.9699 14.1199 21.1099L18.4199 17.8999C19.1799 17.3299 19.8399 15.9999 19.8399 15.0599V7.62995C19.8399 6.71995 19.0899 5.63994 18.2299 5.30994L13.2399 3.43995C12.5799 3.18995 11.4199 3.18995 10.7499 3.43995Z" />
      <path d="M11.9999 12.17C11.9799 12.17 11.9599 12.17 11.9299 12.17C10.4799 12.13 9.41992 11.02 9.41992 9.67004C9.41992 8.29004 10.5499 7.16003 11.9299 7.16003C13.3099 7.16003 14.4399 8.29004 14.4399 9.67004C14.4299 11.03 13.3699 12.13 12.0199 12.18C12.0099 12.17 12.0099 12.17 11.9999 12.17ZM11.9299 8.66003C11.3699 8.66003 10.9199 9.11004 10.9199 9.67004C10.9199 10.22 11.3499 10.66 11.8899 10.68C11.8899 10.68 11.9399 10.68 11.9999 10.68C12.5299 10.65 12.9399 10.21 12.9399 9.67004C12.9499 9.11004 12.4899 8.66003 11.9299 8.66003Z" />
      <path d="M11.9998 17.85C11.1398 17.85 10.2698 17.62 9.59982 17.17C8.92982 16.73 8.5498 16.08 8.5498 15.39C8.5498 14.7 8.92982 14.05 9.59982 13.6C10.9498 12.7 13.0598 12.71 14.3998 13.6C15.0698 14.04 15.4498 14.69 15.4498 15.38C15.4498 16.07 15.0698 16.72 14.3998 17.17C13.7298 17.62 12.8598 17.85 11.9998 17.85ZM10.4298 14.84C10.1798 15 10.0398 15.2 10.0498 15.38C10.0498 15.56 10.1898 15.76 10.4298 15.92C11.2698 16.48 12.7298 16.48 13.5698 15.92C13.8198 15.76 13.9598 15.56 13.9598 15.38C13.9598 15.2 13.8198 15 13.5798 14.84C12.7398 14.29 11.2698 14.29 10.4298 14.84Z" />
    </SvgIcon>
  );
}