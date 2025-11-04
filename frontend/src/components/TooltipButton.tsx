import { Button, ButtonProps, Tooltip } from '@chakra-ui/react';

interface TooltipButtonProps extends ButtonProps {
  tooltipText: string;
}

export const TooltipButton = ({ tooltipText, children, ...props }: TooltipButtonProps) => {
  return (
    <Tooltip label={tooltipText} hasArrow>
      <Button {...props}>
        {children}
      </Button>
    </Tooltip>
  );
};