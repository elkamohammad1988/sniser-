import { m, type Variants, type HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import { staggerContainer, staggerItem } from "../../lib/motion/variants";

type DivMotionProps = Omit<HTMLMotionProps<"div">, "children" | "variants">;

interface ContainerProps extends DivMotionProps {
  children: ReactNode;
  containerVariants?: Variants;
}

interface ItemProps extends DivMotionProps {
  children: ReactNode;
  variants?: Variants;
}

export function StaggerContainer({
  children,
  containerVariants = staggerContainer,
  className,
  ...rest
}: ContainerProps) {
  return (
    <m.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      variants={containerVariants}
      className={className}
      {...rest}
    >
      {children}
    </m.div>
  );
}

export function StaggerItem({
  children,
  variants = staggerItem,
  className,
  ...rest
}: ItemProps) {
  return (
    <m.div variants={variants} className={className} {...rest}>
      {children}
    </m.div>
  );
}
