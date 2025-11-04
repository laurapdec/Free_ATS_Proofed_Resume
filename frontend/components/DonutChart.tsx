import React from 'react';
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react';

interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ percentage, size = 60, strokeWidth = 8 }) => {
  // Theme hooks must be called first
  const greenColor = useColorModeValue('#48BB78', '#68D391'); // green.500, green.300
  const blueColor = useColorModeValue('#4299E1', '#63B3ED'); // blue.500, blue.300
  const orangeColor = useColorModeValue('#ED8936', '#F6AD55'); // orange.500, orange.300

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 90) return greenColor;
    if (score >= 75) return blueColor;
    return orangeColor;
  };

  return (
    <Box position="relative" w={`${size}px`} h={`${size}px`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={useColorModeValue('#EDF2F7', '#2D3748')}
          strokeWidth={strokeWidth}
        />
        {/* Score circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <Flex
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize={size > 50 ? "md" : "2xs"} fontWeight="bold">
          {percentage}%
        </Text>
      </Flex>
    </Box>
  );
};