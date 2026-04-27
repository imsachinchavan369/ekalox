import type { ReactNode, Ref } from "react";

interface ReelContainerProps {
  children: ReactNode;
  containerRef: Ref<HTMLUListElement>;
}

interface ReelSlideProps {
  children: ReactNode;
  productId: string;
  slideRef: Ref<HTMLLIElement>;
}

export function ReelContainer({ children, containerRef }: ReelContainerProps) {
  return (
    <ul
      ref={containerRef}
      className="h-[100dvh] w-full max-w-full snap-y snap-mandatory overflow-x-hidden overflow-y-auto overscroll-contain bg-black"
    >
      {children}
    </ul>
  );
}

export function ReelSlide({ children, productId, slideRef }: ReelSlideProps) {
  return (
    <li
      ref={slideRef}
      data-product-id={productId}
      className="flex h-[100dvh] w-full max-w-full snap-start snap-always items-center justify-center overflow-hidden bg-black"
    >
      {children}
    </li>
  );
}
