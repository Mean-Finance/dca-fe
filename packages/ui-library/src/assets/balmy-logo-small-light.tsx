import React from 'react';
import { CustomSvgIcon, SvgIconProps } from '../components/svgicon';

interface IconProps extends SvgIconProps {
  size?: string;
}
export default function BalmyLogoSmallLight({ size }: IconProps) {
  return (
    <CustomSvgIcon viewBox="0 0 32 40" style={{ fontSize: size, height: 'auto' }}>
      <g id="Group">
        <path
          id="Vector"
          d="M8.80005 13.9949H16.3637C17.6969 13.9949 19.0153 14.2937 20.2105 14.8849C24.8077 17.1601 26.9633 22.0437 25.5917 26.9097C25.4113 27.5509 25.1537 28.1689 24.8273 28.7497C22.4257 33.0196 17.6713 34.9524 12.9565 33.5584C12.4145 33.398 11.8909 33.1808 11.3945 32.9108C7.96364 31.0428 6.00003 27.6729 6.00003 24.0005V22.8405C3.75282 22.8405 1.63441 22.0041 0 20.4773V24.9773C0 29.4836 3.20002 35.6068 8.29525 38.1188C15.5385 41.6896 22.7953 39.842 27.3138 35.3204C30.2094 32.4236 32.0002 28.4213 32.0002 24.0009C32.0002 19.5805 30.2094 15.5781 27.3138 12.6814C24.4185 9.78418 20.4185 7.99219 16.0001 7.99219H8.78205L8.80005 13.9953V13.9949Z"
          fill="#FBFAFF"
        />
        <path
          id="Vector_2"
          d="M6.00003 6.03982V20.0421C2.68641 20.0421 0 17.3554 0 14.0414V0.0390625C1.65681 0.0390625 3.15682 0.710658 4.24242 1.79705C5.32843 2.88264 6.00003 4.38303 6.00003 6.04022V6.03982Z"
          fill="#791AFF"
        />
        <path
          id="Vector_3"
          d="M6.00003 6.01276V20.0431C2.68641 20.0431 0 17.3507 0 14.0303V0C1.65681 0 3.15682 0.673196 4.24242 1.76119C5.32843 2.84918 6.00003 4.35237 6.00003 6.01276Z"
          fill="#07F8BD"
        />
      </g>
    </CustomSvgIcon>
  );
}
