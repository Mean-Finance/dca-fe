import { useThemeMode } from '@state/config/hooks';
import { Strategy } from 'common-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { ComposedChart, CartesianGrid, Area, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ContainerBox, GraphContainer, colors } from 'ui-library';

interface DataHistoricalRateProps {
  strategy?: Strategy;
}

const DataHistoricalRate = ({ strategy }: DataHistoricalRateProps) => {
  const mode = useThemeMode();

  if (!strategy || !('detailed' in strategy)) {
    return;
  }

  const mappedData = strategy.historicalAPY.map((item) => ({
    apy: item.apy,
    timestamp: item.timestamp,
  }));

  return (
    <ContainerBox>
      <GraphContainer
        data={mappedData}
        legend={[
          {
            color: colors[mode].violet.violet500,
            label: (
              <FormattedMessage
                id="strategy-guardian-detail.vault-data.historical-rate.apy.legend"
                defaultMessage="APY"
              />
            ),
          },
        ]}
        title={
          <FormattedMessage
            id="strategy-guardian-detail.vault-data.historical-rate.title"
            defaultMessage="Vault history overview"
          />
        }
        height={270}
      >
        {(data) => (
          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="apy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[mode].violet.violet500} stopOpacity={1} />
                  <stop offset="95%" stopColor="#D2B1FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={colors[mode].border.border1} />
              <Area
                connectNulls
                legendType="none"
                type="monotone"
                fill="url(#apy)"
                strokeWidth="2px"
                dot={false}
                activeDot={false}
                stroke={colors[mode].violet.violet500}
                dataKey="apy"
              />
              <XAxis
                tickMargin={30}
                minTickGap={30}
                interval="preserveStartEnd"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: string) => `${value.split(' ')[0]} ${value.split(' ')[1]}`}
              />
              <YAxis strokeWidth="0px" domain={['auto', 'auto']} axisLine={false} tickLine={false} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </GraphContainer>
    </ContainerBox>
  );
};

export default DataHistoricalRate;
