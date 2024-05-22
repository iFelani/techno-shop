import { useState, useContext, useEffect } from "react";
import { ToastContext } from "../../contexts/Toast";
import useMe from "../../hooks/authentication/me";
import useEmptyCart from "../../hooks/user/emptyCart";
import useUseDiscountCode from "../../hooks/discountCode/use";
import useCreateOrder from "../../hooks/order/create";
import CartProduct from "../../components/CartProduct";
import NoResultFound from "../../components/NoResultFound";
import Loader from "../../components/Loader";
import TomanIcon from "../../icons/Toman";

const Cart = () => {
  const [productsQuantity, setProductsQuantity] = useState(0);
  const [productsPrice, setProductsPrice] = useState(0);
  const [productsPriceWithDiscount, setProductsPriceWithDiscount] = useState(0);
  const [amazingOfferPrice, setAmazingOfferPrice] = useState(0);
  const [code, setCode] = useState("");
  const [categories, setCategories] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [destination, setDestination] = useState(null);

  const { openToast } = useContext(ToastContext);

  const { me } = useMe();
  const { isPendingEmptyCart, emptyCart } = useEmptyCart();
  const { isPendingUseDiscountCode, discountCode, useDiscountCode } = useUseDiscountCode(code);
  const { isPendingCreateOrder, createOrder } = useCreateOrder();

  useEffect(() => {
    document.title = "تکنوشاپ - من - سبد خرید";
  }, []);

  useEffect(() => {
    setProductsQuantity(me.cart.filter(({ color }) => color.inventory !== 0).reduce((previous, { quantity }) => previous + quantity, 0),);
    setProductsPrice(me.cart.filter(({ color }) => color.inventory !== 0).reduce((previous, { quantity, color }) => previous + quantity * color.price, 0));
    setProductsPriceWithDiscount(me.cart.filter(({ color }) => color.inventory !== 0).reduce((previous, { quantity, product, color }) => previous + quantity * (Date.parse(product.offer?.expiresAt) > Date.now() ? color.price - color.price * (product.offer.percent / 100) : color.price), 0));
    setAmazingOfferPrice(me.cart.filter(({ product, color }) => color.inventory !== 0 && Date.parse(product.offer?.expiresAt) > Date.now()).reduce((previous, { quantity, product, color }) => previous + (quantity * color.price * product.offer.percent) / 100, 0));
    setTotalPrice(productsPriceWithDiscount - productsPriceWithDiscount * ((discountCode?.percent || 0) / 100));
    setCategories(me.cart.filter(({ color }) => color.inventory !== 0).map(({ product }) => product.category._id));
    setDestination(me.addresses[0]._id || null);
  }, [me, productsPriceWithDiscount, discountCode]);

  return me.cart.filter(({ color }) => color.inventory !== 0).length !== 0 ? (
    <>
      <div>
        <div className="flex items-center justify-between gap-x-2">
          <span className="text-zinc-400">{productsQuantity.toLocaleString()} محصول</span>
          <button disabled={isPendingEmptyCart} className="flex items-center gap-x-2 text-red-500" onClick={emptyCart}>حذف همه</button>
        </div>
        <div className="mt-4 divide-y divide-zinc-200">
          {me.cart.map((product) => <CartProduct key={product._id} {...product} />)}
        </div>
      </div>
      <div className="mt-6 border-t border-zinc-200 pt-6">
        <span className="text-zinc-400">آدرس</span>
        <div className="mt-4 divide-y divide-zinc-200 text-lg">
          {me.addresses.length !== 0 ? me.addresses.map(({ _id, postalCode, body }) => (
            <button key={_id} className={`flex w-full items-center gap-x-2 overflow-auto text-nowrap py-2 first:pt-0 last:pb-0 ${destination === _id ? "text-primary-900" : "text-zinc-900"}`} onClick={() => setDestination(_id)}>
              <span>{postalCode}</span>
              <span className={`h-3 w-px ${destination === _id ? "bg-primary-900" : "bg-zinc-900"} shrink-0`}></span>
              <p>{body}</p>
            </button>
          )) : (
            <NoResultFound title="آدرسی پیدا نشد!" />
          )}
        </div>
      </div>
      <div className="mt-6 border-t border-zinc-200 pt-6 text-lg">
        <div className="overflow-auto text-nowrap">
          <div className="flex items-center justify-between gap-x-4">
            <span className="text-zinc-400">محصولات ({productsQuantity.toLocaleString()}):</span>
            <span className="flex items-center gap-x-[2px] font-vazirmatn-bold">
              {productsPrice.toLocaleString()}
              <TomanIcon className="size-5" />
            </span>
          </div>
          {me.cart.filter(({ color }) => color.inventory !== 0).some(({ product }) => Date.parse(product.offer?.expiresAt) > Date.now()) && (
            <div className="mt-2 flex items-center justify-between gap-x-4">
              <span className="text-zinc-400">پیشنهاد شگفت انگیز (%{Math.round((amazingOfferPrice / productsPrice) * 100)}):</span>
              <span className="flex items-center gap-x-[2px] font-vazirmatn-bold">
                {amazingOfferPrice.toLocaleString()}
                <TomanIcon className="size-5" />
              </span>
            </div>
          )}
          {discountCode && (
            <div className="mt-2 flex items-center justify-between gap-x-4">
              <span className="text-zinc-400">کد تخفیف (%{discountCode.percent}):</span>
              <span className="flex items-center gap-x-[2px] font-vazirmatn-bold">
                {((productsPriceWithDiscount * discountCode.percent) / 100).toLocaleString()}
                <TomanIcon className="size-5" />
              </span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between gap-x-4">
            <span className="text-zinc-400">مبلغ قابل پرداخت:</span>
            <span className="flex items-center gap-x-[2px] font-vazirmatn-bold">
              {totalPrice.toLocaleString()}
              <TomanIcon className="size-5" />
            </span>
          </div>
        </div>
        {!discountCode && (
          <form className="mt-6 flex items-center gap-x-2 text-lg" onSubmit={(event) => {
            event.preventDefault();

            if (/^[a-zA-Z\d]{7}$/.test(code.trim())) {
              if (totalPrice > 1000) {
                if (categories.length >= 1 && categories.length <= 7) {
                  useDiscountCode({ price: totalPrice, categories });
                } else {
                  openToast("error", null, "تعداد دسته‌بندی‌ محصولات باید بین 1 تا 7 باشد.");
                }
              } else {
                openToast("error", null, "مبلغ کل محصول(ها) باید بالای 1000 تومان باشد.");
              }
            } else {
              openToast("error", null, "کد تخفیف باید 7 کاراکتر باشد.");
            }
          }}>
            <input
              type="text"
              value={code}
              placeholder="کد تخفیف"
              className="h-14 w-full rounded-3xl border border-zinc-200 px-4 outline-none"
              onInput={({ target }) => /^[a-zA-Z\d]{0,7}$/.test(target.value) && setCode(target.value)}
            />
            <button type="submit" disabled={isPendingUseDiscountCode} className="flex h-14 w-48 items-center justify-center rounded-full bg-primary-900 text-white transition-colors hover:bg-primary-800">
              {isPendingCreateOrder ? <Loader width={"40px"} height={"10px"} color={"#ffffff"} /> : "اعمال"}
            </button>
          </form>
        )}
        <button disabled={isPendingCreateOrder} className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-primary-900 text-lg text-white transition-colors hover:bg-primary-800" onClick={() => createOrder({ totalPrice, products: me.cart.filter(({ color }) => color.inventory !== 0).map(({ quantity, product, color }) => ({ quantity, product: product._id, color: color._id })), destination, discountCode })}>
          {isPendingCreateOrder ? <Loader width={"40px"} height={"10px"} color={"#ffffff"} /> : "ثبت سفارش"}
        </button>
      </div>
    </>
  ) : (
    <div className="flex flex-col items-center justify-center gap-y-3">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" className="max-w-52 sm:max-w-64">
        <path d="M0 508.53c0-25.39 12.38-48.36 32.39-64.99 20.02-16.64 47.66-26.93 78.19-26.93h91.4c-4.38 32.02-10.92 85.91-17.13 161.16-.79 9.58-1.72 19.57-2.78 29.84-13.18-4.61-27.63-7.15-42.81-7.15h-28.68c-61.07 0-110.59-41.16-110.59-91.93zM559.69 48.94H110.59c-30.53 0-58.17 10.29-78.19 26.92C12.38 92.49 0 115.47 0 140.85c0 50.77 49.51 91.92 110.59 91.92h235.92c61.08 0 110.61 41.16 110.61 91.93 0 2.03-.08 4.04-.24 6.04l22.41-18.4c1.75-1.44 4.33-1.14 5.69.66l22.5 29.82c1.35 1.8 3.92 2.12 5.67.7l34.13-27.75v-58.44c-7.8.7-18.86.14-29.05-5.84-18.31-10.74-10.6-21.88-10.6-21.88 0 0-13.28-7.57-19.66-26.12-6.36-18.58 5.18-24.83 5.18-24.83 0 0-11.53-9.57-13.13-28.27-1.61-18.7 21.09-41.39 21.09-41.39 0 0 .02-.44.07-1.2l-1.16.42c.38-.52.81-1 1.23-1.49.47-6.01 2.35-22.41 9.44-30.76 8.78-10.36 44.95-8.75 44.95-8.75 0 0-1.7-9.15 4.07-18.27zm-99.9 150.9c-10.22 0-18.51-8.29-18.51-18.51s8.29-18.51 18.51-18.51 18.51 8.29 18.51 18.51-8.29 18.51-18.51 18.51zM618.5 51.39s-1.39-.99-3.72-2.46h4.94c-.99 1.51-1.21 2.46-1.21 2.46zM1000 876.21c0 25.39-12.38 48.36-32.4 64.99-20.01 16.64-47.65 26.92-78.18 26.92H110.59c-61.07 0-110.59-41.16-110.59-91.92 0-25.37 12.38-48.36 32.39-64.99 20.02-16.63 47.66-26.92 78.19-26.92h28.68c6.62 0 13.12-.49 19.41-1.41-8.71 56.13-16.78 102.57-19.92 120.29-.68 3.85 2.51 7.27 6.41 6.87 171.29-17.75 519.37 26.85 567.79 33.25 3.15.41 6.08-1.77 6.56-4.91 9.96-8.31 20.86-16.33 32.07-23.93l-.83 10.79 9.59-16.59c38.46-24.95 78.85-44.53 97.39-53.08 6.08-2.8 9.49-9.35 8.29-15.95-2-11.01-5.28-29.82-9.24-55.35h32.61c61.07 0 110.59 41.16 110.59 91.92zM1000 508.53c0 25.39-12.38 48.36-32.4 64.99-20.01 16.64-47.65 26.93-78.18 26.93h-55.67c-.48-4.82-.94-9.7-1.41-14.63-9.16-97.03-18.88-158.95-24.69-193.1 19.64 14.84 45.72 23.87 74.34 23.87h7.43c61.07 0 110.59 41.16 110.59 91.93zM889.41 48.94h-194.34c2.23 2.33 3.43 3.93 3.43 3.93 0 0 13.13-7.16 27.86 9.95 13.78 16.02 4.91 62.4 3.71 68.34.41.28.81.56 1.2.87l-.52.23c2.55 1.7 10.44 8.51 14.41 29.37 4.78 25.08-22.37 41.2-22.37 41.2 0 0 1.19 14.92-12.55 31.33-13.72 16.43-45.98 8.76-45.98 8.76 0 0-4.17 16.52-18.7 27.26-14.53 10.74-57.11 3.4-57.11 3.4l-21.68 53.43 13.92 20.01c1.4 2.03 4.29 2.29 6.04.56l35.24-34.73c1.69-1.68 4.48-1.49 5.92.41l22.91 29.7c1.33 1.75 3.83 2.07 5.56.73l40.49-31.26c1.87-1.45 4.6-.94 5.83 1.09l20.51 34.17c1.2 2.03 3.9 2.55 5.78 1.13l42.46-21.21c-.03-.97-.06-1.94-.06-2.92 0-25.39 12.37-48.36 32.39-64.99s47.66-26.93 78.21-26.93h7.43c30.53 0 58.17-10.29 78.18-26.92 20.02-16.63 32.4-39.61 32.4-64.99 0-50.76-49.51-91.92-110.59-91.92zm-209.92 226.74c-3.96 0-7.16-3.21-7.16-7.17s3.2-7.17 7.16-7.17 7.17 3.21 7.17 7.17-3.21 7.17-7.17 7.17zm83.57-126.58c-9.58 0-17.33-9.22-17.33-20.6s7.75-20.59 17.33-20.59 17.33 9.22 17.33 20.59-7.76 20.6-17.33 20.6zM178.08 643.5c-4.39 36.97-9.81 75.84-15.26 112.16-3.99.84-8.14 1.28-12.38 1.28-33.18 0-60.08-26.91-60.08-60.08s26.9-60.08 60.08-60.08c9.96 0 19.37 2.43 27.64 6.73z" fill="#a1a1aa" opacity="0.25" />
        <circle cx="863.04" cy="327.44" r="60.08" fill="#a1a1aa" opacity="0.25" />
        <path d="m400.79,316.84l-33.1,28.7c-1.82,1.57-4.6,1.19-5.92-.81l-20.71-31.3c-1.32-1.99-4.06-2.37-5.88-.83l-37.3,31.68c-1.62,1.36-4,1.23-5.45-.29l-26.95-28.31c-2.29-2.41-6.36-1.09-6.81,2.21l-6.42,47.56c-.49,3.63-5.24,4.71-7.25,1.65l-3.38-5.12c-2-3.05-6.72-2.01-7.24,1.59l-3.61,24.47h-65.24c-33.32,0-60.34-27.02-60.34-60.34h0c0-33.34,27.02-60.35,60.34-60.35h175.89c29.62,0,54.25,21.33,59.36,49.48Z" fill="#a1a1aa" opacity="0.25" />
        <path d="m802.79,367.46c-.87-.6-2.3-.26-2.54,1.05l-6.73,49.14c-.29,1.59-2.47,1.84-3.1.35l-8.11-18.82c-.63-1.48-2.79-1.24-3.1.34l-7.75,41.04c-.28,1.47-2.24,1.82-3,.51-3.91-6.66-11.86-20.37-14.52-25.7-3.33-6.69-10.53-5.99-11.49-5.86-.07,0-.11.01-.11.01-1.32.12-2.64.68-3.71,1.8l-40.49,42.42c-2.98,3.12-8.18,2.09-9.75-1.93l-16.58-42.73c-1.55-4.02-6.77-5.05-9.75-1.93l-44.31,46.46c-2.51,2.63-6.8,2.37-8.98-.54l-36.67-49.14c-2.1-2.82-6.19-3.18-8.75-.77l-48.67,45.68c-2.54,2.37-6.57,2.05-8.7-.71l-36.81-47.86c-2.14-2.77-6.22-3.07-8.75-.64l-36.9,35.47c-2.6,2.49-6.8,2.09-8.89-.84l-28.33-40.08c-2.23-3.17-6.86-3.34-9.34-.35l-33.84,40.89c-2.26,2.72-6.38,2.86-8.82.29l-36.89-39.06c-2.3-2.43-6.16-2.47-8.49-.08l-29.17,29.87c-2.29,2.34-6.06,2.36-8.37.05l-22.86-22.86c.05-.19.09-.4.13-.61l5.72-38.74c.53-3.61,5.24-4.65,7.24-1.6l3.38,5.12c2.01,3.06,6.76,1.99,7.25-1.65l6.42-47.56c.46-3.3,4.52-4.62,6.82-2.21l26.94,28.31c1.45,1.53,3.83,1.66,5.45.29l37.31-31.69c1.81-1.54,4.56-1.16,5.88.83l20.71,31.3c1.32,2,4.1,2.39,5.92.82l38.3-33.21c1.67-1.45,4.22-1.24,5.65.47l24.73,29.69c1.4,1.67,3.89,1.91,5.58.51l37.33-30.68c1.75-1.44,4.34-1.13,5.69.67l22.5,29.83c1.36,1.8,3.93,2.12,5.67.69l34.13-27.74v40.75c0,3.98,5.48,5.05,6.98,1.37l12.52-30.87,13.92,20.01c1.4,2.02,4.29,2.29,6.04.56l35.24-34.74c1.7-1.67,4.48-1.48,5.93.41l22.9,29.71c1.33,1.74,3.83,2.07,5.57.72l40.49-31.26c1.88-1.45,4.61-.94,5.83,1.1l20.51,34.18c1.2,2.02,3.91,2.55,5.79,1.12l60.94-30.43c2-1.52,4.9-.81,5.97,1.46l6.63,46.88c.12.23.2.47.26.73Z" fill="#a1a1aa" opacity="0.75" />
        <path d="m693.89,458.57c-.58,0-1.16-.06-1.74-.17-3-.59-5.45-2.65-6.56-5.5l-16.58-42.74c-.52-1.33-1.65-1.69-2.12-1.78-.47-.1-1.67-.2-2.66.84l-44.31,46.46c-1.81,1.9-4.35,2.89-6.97,2.73-2.62-.16-5.02-1.45-6.58-3.55l-36.67-49.14c-.5-.67-1.23-1.08-2.06-1.15-.83-.07-1.62.2-2.22.77l-48.68,45.68c-1.83,1.71-4.3,2.57-6.8,2.37-2.49-.2-4.8-1.46-6.33-3.44l-36.81-47.86c-.5-.65-1.24-1.05-2.07-1.11-.83-.06-1.62.22-2.21.8l-36.9,35.48c-1.87,1.79-4.42,2.69-7,2.44-2.58-.24-4.92-1.6-6.41-3.71l-28.33-40.08c-.52-.74-1.34-1.18-2.24-1.22-.9-.03-1.76.35-2.34,1.05l-33.84,40.89c-1.63,1.96-4.02,3.14-6.56,3.22-2.54.1-5-.93-6.75-2.78l-36.89-39.06c-.55-.58-1.29-.9-2.09-.91-.8,0-1.52.3-2.07.86l-29.17,29.87c-1.68,1.71-3.92,2.66-6.31,2.67h-.05c-2.37,0-4.6-.92-6.28-2.6l-24.06-24.06.41-1.65c.03-.12.06-.25.08-.38l5.71-38.68c.42-2.89,2.54-5.16,5.39-5.79,2.85-.63,5.73.54,7.33,2.98l3.37,5.11c.31.47.73.48,1.03.41.3-.07.67-.26.75-.81l6.42-47.56c.37-2.69,2.2-4.87,4.78-5.7,2.57-.83,5.32-.13,7.18,1.83l26.94,28.31c.36.38.93.41,1.34.07l37.31-31.68c1.51-1.29,3.51-1.87,5.48-1.59,1.97.28,3.74,1.39,4.84,3.05l20.71,31.3c.21.32.52.41.68.43.16.02.48.02.77-.23l38.3-33.2c1.42-1.23,3.24-1.82,5.11-1.67,1.88.15,3.59,1.03,4.8,2.49l24.73,29.69c.34.4.95.46,1.36.12l37.34-30.68c1.49-1.22,3.36-1.77,5.27-1.54,1.9.23,3.58,1.19,4.73,2.72l22.49,29.82c.22.29.51.37.66.38.18.02.45,0,.71-.21l39.03-31.73v47.05c0,.17,0,.51.51.61.5.09.63-.22.69-.37l14.6-35.99,17.09,24.55c.23.33.54.4.71.41.17.01.49,0,.77-.28l35.24-34.74c1.42-1.4,3.39-2.12,5.37-1.99,1.99.14,3.83,1.13,5.04,2.71l22.9,29.7c.22.28.5.36.65.38.15.02.43.02.7-.19l40.5-31.27c1.58-1.21,3.6-1.7,5.55-1.33,1.95.37,3.66,1.55,4.69,3.25l20.51,34.18c.19.32.48.42.64.45.16.03.47.05.77-.18l.22-.17.25-.12,60.72-30.33c1.63-1.13,3.65-1.5,5.6-1.03,2.05.5,3.74,1.88,4.65,3.78l.2.41,6.64,46.93c.11.29.2.58.27.89l1.69,7.48-4.49-3.1-6.44,47.01c-.37,2.03-2,3.54-4.05,3.77-2.04.23-3.96-.89-4.76-2.79l-6.34-14.7-6.92,36.64c-.37,1.92-1.85,3.37-3.77,3.7-1.92.33-3.8-.55-4.77-2.24-2.68-4.57-11.67-19.97-14.61-25.86-2.29-4.6-7.2-4.35-8.26-4.24h-.04s-.35.04-.35.04c-.7.06-1.3.36-1.79.88l-40.5,42.43c-1.7,1.78-4.02,2.76-6.42,2.76Zm-27.58-56.25c.58,0,1.17.06,1.76.17,3,.6,5.44,2.65,6.54,5.5l16.58,42.73c.37.94,1.14,1.59,2.13,1.79.99.2,1.96-.11,2.66-.84l40.49-42.42c1.47-1.55,3.36-2.48,5.47-2.7.08-.01.17-.02.25-.03,1.54-.18,10.3-.8,14.44,7.51,2.02,4.04,7.52,13.69,12.58,22.35l7.07-37.43c.39-2.03,2.02-3.53,4.07-3.75,2.04-.21,3.94.91,4.74,2.79l6.16,14.29,6.07-44.31c.22-1.26.93-2.34,1.95-3.02l-6.23-44.08c-.16-.17-.35-.24-.47-.27-.16-.04-.49-.07-.8.16l-.22.17-.25.13-60.72,30.33c-1.54,1.06-3.44,1.46-5.28,1.1-1.94-.38-3.63-1.57-4.64-3.26l-20.5-34.17c-.19-.32-.49-.42-.66-.45-.16-.03-.47-.05-.78.19l-40.49,31.26c-1.46,1.14-3.3,1.64-5.15,1.4-1.85-.24-3.5-1.19-4.64-2.67l-22.9-29.7c-.23-.31-.54-.37-.7-.38-.16-.01-.48,0-.75.28l-35.24,34.74c-1.47,1.45-3.49,2.17-5.54,1.98-2.05-.19-3.9-1.27-5.08-2.96l-10.76-15.46-10.44,25.74c-1.21,2.97-4.25,4.62-7.4,4-3.15-.62-5.36-3.29-5.36-6.5v-34.44l-29.24,23.77c-1.47,1.2-3.33,1.75-5.22,1.52-1.9-.23-3.58-1.2-4.74-2.73l-22.49-29.82c-.2-.27-.47-.35-.65-.37-.16-.02-.46-.01-.75.22l-37.33,30.68c-2.94,2.42-7.33,2.02-9.78-.9l-24.74-29.69c-.23-.27-.52-.34-.68-.35-.15-.01-.44,0-.7.23l-38.3,33.21c-1.52,1.31-3.52,1.91-5.51,1.63-1.99-.27-3.76-1.39-4.87-3.06l-20.71-31.3c-.21-.32-.51-.4-.67-.42-.16-.02-.47-.02-.76.22l-37.31,31.69c-2.83,2.4-7.03,2.17-9.57-.52l-26.93-28.3c-.36-.38-.78-.32-1-.25-.22.07-.6.27-.68.8l-6.42,47.55c-.39,2.91-2.5,5.21-5.36,5.86-2.86.65-5.76-.51-7.37-2.97l-3.38-5.12c-.31-.47-.73-.49-1.02-.42-.3.07-.67.26-.75.8l-5.59,37.89,21.76,21.76c.54.54,1.27.84,2.04.84h.02c.78,0,1.51-.31,2.05-.87l29.17-29.87c1.7-1.74,3.97-2.69,6.41-2.67,2.45.02,4.72,1.01,6.4,2.78l36.89,39.07c.57.61,1.35.93,2.19.9.84-.03,1.6-.4,2.13-1.05l33.84-40.89c1.78-2.16,4.41-3.32,7.2-3.22,2.78.11,5.3,1.48,6.91,3.75l28.33,40.08c.49.69,1.23,1.12,2.08,1.2.85.08,1.66-.2,2.28-.79l36.9-35.47c1.81-1.75,4.29-2.65,6.81-2.46,2.52.19,4.84,1.44,6.38,3.43l36.81,47.86c.5.65,1.24,1.05,2.06,1.12.83.07,1.61-.21,2.21-.77l48.67-45.68c1.84-1.73,4.34-2.59,6.85-2.38,2.52.22,4.83,1.51,6.35,3.54l36.67,49.14c.69.93,1.64,1.12,2.14,1.15.51.03,1.47-.04,2.27-.89l44.31-46.46c1.7-1.78,4.02-2.76,6.42-2.76Zm104.73,37.22s0,0,0,0c0,0,0,0,0,0Zm22.14-22.74h0s0,0,0,0Zm-13.62-16.44s0,0,0,0h0Z" fill="#a1a1aa" />
        <path d="m857.75,855.59c-25.42,11.72-91.93,44.16-138.21,82.8,2.54-16.11,10.14-69.79,22.34-201.22,6.91-74.37,8.84-150.41,8.89-211.26.04-50.64-1.23-90.78-2.01-110.75-.14-3.6-3.24-5.86-6.33-5.65.96-.13,8.16-.83,11.49,5.86,2.67,5.33,10.62,19.03,14.52,25.7.76,1.31,2.72.96,3-.51l7.75-41.04c.3-1.58,2.47-1.82,3.1-.34l8.11,18.82c.63,1.48,2.81,1.24,3.1-.35l6.73-49.14c.23-1.31,1.67-1.65,2.54-1.05.33.22.58.58.67,1.08,3.83,22.87,16.84,89.77,28.88,217.29,12.29,130.08,28.07,222.85,33.71,253.81,1.2,6.59-2.21,13.14-8.29,15.95Z" fill="#a1a1aa" opacity="0.75" />
        <path d="m715.34,945.81l1.24-7.89c2.67-16.99,10.2-70.58,22.32-201.03,5.83-62.73,8.81-133.72,8.87-210.99.04-50.79-1.24-91.11-2.01-110.63-.04-1.02-.52-1.65-.91-2.01-.59-.53-1.42-.82-2.21-.76l-.6-5.97c1.04-.14,10.29-1.11,14.58,7.49,2.02,4.04,7.52,13.69,12.58,22.35l7.07-37.43c.39-2.03,2.02-3.53,4.07-3.75,2.03-.22,3.94.91,4.74,2.79l6.16,14.29,6.07-44.31c.28-1.56,1.3-2.85,2.74-3.45,1.46-.61,3.16-.44,4.45.45,1.02.69,1.71,1.78,1.92,3.05.43,2.56.98,5.68,1.62,9.39,4.96,28.37,16.58,94.82,27.28,208.12,12.15,128.64,27.6,220.17,33.67,253.55,1.45,7.93-2.66,15.83-9.98,19.21h0c-26.1,12.03-91.74,44.13-137.54,82.38l-6.13,5.12Zm36.53-527.87c.77,20.48,1.94,59.47,1.9,107.98-.06,77.45-3.05,148.62-8.9,211.54-10.69,115.1-17.82,170.51-21.2,193.71,45.9-36.51,107.64-66.68,132.83-78.29h0c4.84-2.23,7.55-7.45,6.6-12.69-6.09-33.46-21.57-125.2-33.74-254.07-10.68-113.06-22.27-179.34-27.22-207.65-.04-.23-.08-.46-.12-.68l-5.54,40.41c-.37,2.03-2,3.54-4.05,3.77-2.04.23-3.96-.89-4.76-2.79l-6.34-14.7-6.92,36.64c-.37,1.92-1.85,3.37-3.77,3.7-1.91.33-3.79-.55-4.77-2.24-2.51-4.28-10.56-18.08-13.99-24.64Zm105.88,437.65h.01-.01Zm-86.72-416.04s0,0,0,0c0,0,0,0,0,0Zm22.14-22.74h0s0,0,0,0Zm-13.62-16.44s0,0,0,0h0Z" fill="#a1a1aa" />
        <path d="m750.77,525.91c-.05,60.86-1.98,136.89-8.89,211.26-12.21,131.43-19.81,185.11-22.34,201.22-.49,3.15-3.41,5.32-6.57,4.91-48.42-6.41-396.51-51-567.8-33.25-3.89.41-7.09-3.02-6.41-6.87,6.77-38.33,36.58-210.58,46.09-325.41,8.16-98.7,16.85-160.67,20.54-184.72.74-4.76,6.57-6.66,9.98-3.26l36.01,36.01c2.32,2.31,6.08,2.29,8.37-.05l29.17-29.87c2.33-2.39,6.19-2.35,8.49.08l36.89,39.06c2.43,2.57,6.56,2.43,8.82-.29l33.84-40.89c2.48-2.99,7.11-2.82,9.34.35l28.33,40.08c2.08,2.93,6.29,3.33,8.89.84l36.9-35.47c2.53-2.43,6.61-2.13,8.75.64l36.81,47.86c2.13,2.76,6.16,3.09,8.7.71l48.67-45.68c2.56-2.41,6.64-2.05,8.75.77l36.67,49.14c2.17,2.91,6.47,3.17,8.98.54l44.31-46.46c2.98-3.12,8.2-2.09,9.75,1.93l16.58,42.73c1.57,4.02,6.77,5.05,9.75,1.93l40.49-42.42c1.06-1.12,2.39-1.68,3.71-1.8.05-.01.07-.01.11-.01,3.09-.21,6.18,2.05,6.33,5.65.78,19.97,2.05,60.11,2.01,110.75Z" fill="#a1a1aa" opacity="0.5" />
        <path d="m713.71,946.35c-.37,0-.75-.02-1.13-.07-39.92-5.28-394.9-51.09-567.1-33.24-2.8.29-5.5-.72-7.42-2.77-1.92-2.06-2.74-4.83-2.25-7.61,6.02-34.05,36.5-209.75,46.05-325.14,8.25-99.76,17.13-162.56,20.57-184.93.51-3.32,2.82-6.04,6.01-7.08,3.2-1.05,6.67-.22,9.05,2.15l36.02,36.02c.54.54,1.27.84,2.04.84h.02c.78,0,1.51-.31,2.05-.87l29.17-29.87c1.7-1.74,3.97-2.69,6.41-2.67,2.45.02,4.72,1.01,6.4,2.78l36.89,39.07c.57.61,1.34.92,2.19.9.84-.03,1.6-.4,2.13-1.05l33.84-40.89c1.78-2.16,4.42-3.32,7.2-3.22,2.78.11,5.3,1.48,6.91,3.75l28.33,40.08c.49.69,1.23,1.12,2.08,1.2.85.08,1.66-.2,2.28-.79l36.9-35.47c1.81-1.75,4.29-2.64,6.81-2.46,2.52.19,4.84,1.44,6.38,3.43l36.81,47.86c.5.65,1.24,1.05,2.06,1.12.83.07,1.61-.21,2.21-.77l48.67-45.68c1.84-1.73,4.34-2.59,6.85-2.38,2.52.22,4.83,1.51,6.35,3.54l36.67,49.14c.69.93,1.64,1.12,2.14,1.15.51.03,1.47-.04,2.27-.89l44.31-46.46c2.12-2.22,5.17-3.18,8.18-2.58,3,.6,5.44,2.65,6.54,5.5l16.58,42.73c.37.94,1.14,1.59,2.13,1.79.99.19,1.96-.11,2.66-.84l40.49-42.42c1.47-1.55,3.36-2.48,5.47-2.7.15-.02.28-.03.39-.04,2.38-.14,4.77.69,6.55,2.29,1.77,1.59,2.8,3.81,2.9,6.24.77,19.56,2.05,59.97,2.01,110.86h0c-.06,77.45-3.05,148.62-8.9,211.54-12.13,130.62-19.68,184.36-22.37,201.41-.67,4.33-4.5,7.49-8.79,7.49Zm-472.67-43.41c183.55,0,438.81,32.95,472.33,37.39,1.53.19,2.98-.88,3.21-2.4,2.68-16.99,10.21-70.58,22.32-201.03,5.83-62.73,8.81-133.72,8.87-210.99.04-50.79-1.24-91.11-2.01-110.63-.04-1.02-.52-1.65-.91-2.01-.57-.51-1.38-.8-2.13-.77h-.13c-.7.07-1.3.37-1.79.89l-40.5,42.43c-2.11,2.21-5.17,3.18-8.16,2.59-3-.59-5.45-2.65-6.56-5.5l-16.58-42.74c-.52-1.33-1.65-1.69-2.12-1.78-.47-.1-1.67-.2-2.66.84l-44.31,46.46c-1.81,1.9-4.35,2.89-6.97,2.73-2.62-.16-5.02-1.45-6.58-3.55l-36.67-49.14c-.5-.67-1.23-1.08-2.06-1.15-.83-.07-1.62.2-2.22.77l-48.68,45.68c-1.83,1.71-4.3,2.57-6.8,2.37-2.49-.2-4.8-1.46-6.33-3.44l-36.81-47.86c-.5-.65-1.24-1.05-2.07-1.11-.82-.06-1.62.22-2.21.8l-36.9,35.48c-1.87,1.79-4.42,2.69-7,2.44-2.58-.24-4.92-1.6-6.41-3.71l-28.33-40.08c-.52-.74-1.34-1.18-2.24-1.22-.9-.03-1.76.35-2.34,1.05l-33.84,40.89c-1.63,1.96-4.02,3.14-6.56,3.22-2.54.09-5-.93-6.75-2.78l-36.89-39.06c-.55-.58-1.29-.9-2.09-.91-.8,0-1.52.3-2.07.86l-29.17,29.87c-1.68,1.71-3.92,2.66-6.31,2.67h-.05c-2.37,0-4.6-.92-6.28-2.6l-36.01-36.01c-.79-.78-1.89-1.04-2.95-.7-1.05.35-1.78,1.2-1.95,2.3-3.43,22.3-12.29,84.94-20.52,184.51-9.57,115.65-40.1,291.59-46.13,325.68-.16.9.11,1.8.73,2.47.62.67,1.5.99,2.41.9,27.97-2.9,60.75-4.13,96.18-4.13Zm509.73-377.03h0,0Z" fill="#a1a1aa" />
        <ellipse cx="406.7" cy="580.13" rx="15.42" ry="22.13" fill="#a1a1aa" />
        <ellipse cx="521.98" cy="580.13" rx="15.42" ry="22.13" fill="#a1a1aa" />
        <path d="m418.78,689.07c.92-1.95,1.94-3.85,3.06-5.7.54-.9,1.11-1.78,1.7-2.64.28-.41.56-.81.85-1.21.33-.46.9-.98,1.1-1.49-.34.87-.62.79-.26.34.15-.19.31-.39.46-.58.35-.43.7-.86,1.06-1.28.72-.85,1.46-1.67,2.23-2.48,1.49-1.57,3.05-3.06,4.68-4.47.37-.32.75-.64,1.13-.95.19-.16.38-.31.57-.47.12-.1,1.11-.8.26-.22s.56-.42.72-.53c.5-.36,1-.72,1.5-1.07,1.77-1.22,3.6-2.36,5.49-3.39.86-.47,1.73-.92,2.62-1.35.5-.24,1-.48,1.5-.71.22-.1.45-.2.67-.3.87-.38.23,0-.25.1,1.02-.21,2.09-.83,3.09-1.18s2.09-.7,3.15-1c2-.57,4.03-1.04,6.08-1.38.29-.05,2.1-.32,1.02-.17s.63-.07.85-.09c1.16-.12,2.33-.2,3.49-.24,2.04-.07,4.09-.02,6.12.16.48.04.95.09,1.43.15.17.02,1.38.15.27.03-.98-.11-.16-.02.09.02,1.07.17,2.13.36,3.18.59,2.05.45,4.07,1.02,6.06,1.7.97.33,1.91.71,2.86,1.08.73.28-1.15-.5-.44-.19.22.1.44.19.66.29.55.24,1.09.5,1.63.76,1.89.92,3.72,1.94,5.5,3.07.81.51,1.6,1.05,2.39,1.6.44.31.87.64,1.3.95.62.46-.96-.76-.36-.28.23.19.47.37.7.56,1.85,1.51,3.6,3.13,5.23,4.87.77.82,1.52,1.67,2.24,2.55.19.23.37.46.56.69.67.82-.61-.82-.18-.23.35.48.7.95,1.04,1.44,1.32,1.9,2.51,3.89,3.55,5.96.27.53.52,1.07.77,1.61.1.21.18.44.29.65l-.33-.78c.09.22.18.44.27.66.44,1.11.83,2.24,1.18,3.38.93,2.99,4.23,5.21,7.38,4.19s5.19-4.17,4.19-7.38c-5.73-18.5-21.55-32.62-39.99-37.91-18.59-5.33-38.83-.57-54.04,11.09-8.71,6.68-15.99,15.15-20.7,25.11-1.34,2.83-.88,6.61,2.15,8.21,2.67,1.41,6.78.88,8.21-2.15h0Z" fill="#a1a1aa" />
        <path d="M181.27 853.91c-1.64 0-2.98-1.32-3-2.96-.02-1.66 1.3-3.02 2.96-3.04l325.29-4.48c1.67-.04 3.02 1.3 3.04 2.96.02 1.66-1.3 3.02-2.96 3.04l-325.29 4.48h-.04zM391.28 872.72h-35.38c-1.66 0-3-1.34-3-3s1.34-3 3-3h35.38c1.66 0 3 1.34 3 3s-1.34 3-3 3zM555.61 768.83c-1.55 0-2.87-1.2-2.99-2.77-.13-1.65 1.11-3.09 2.76-3.22l145.08-11.19c1.65-.12 3.09 1.11 3.22 2.76.13 1.65-1.11 3.09-2.76 3.22l-145.08 11.19c-.08 0-.16 0-.23 0zM754.67 913.51c-.55 0-1.11-.15-1.61-.47-1.4-.89-1.81-2.75-.92-4.14l49.4-77.47-13.75-423.11c-.05-1.66 1.25-3.04 2.9-3.1 1.61-.05 3.04 1.25 3.1 2.9l13.81 424.97-.5.78-49.89 78.26c-.57.9-1.54 1.39-2.53 1.39z" fill="#a1a1aa" />
        <path d="m854.43,858.41c-.42,0-.85-.09-1.26-.28l-49.86-23.16c-1.5-.7-2.16-2.48-1.46-3.98.7-1.5,2.48-2.16,3.98-1.46l49.86,23.16c1.5.7,2.16,2.48,1.46,3.98-.51,1.09-1.59,1.74-2.72,1.74Z" fill="#a1a1aa" />
        <path d="m722.79,202.84s1.19,14.92-12.55,31.33c-13.73,16.43-45.97,8.76-45.97,8.76,0,0-4.17,16.52-18.71,27.27-14.52,10.74-57.12,3.39-57.12,3.39l-21.69,53.43-12.52,30.87c-1.5,3.68-6.98,2.61-6.98-1.37v-99.18c-7.8.69-18.86.14-29.05-5.85-18.31-10.74-10.6-21.89-10.6-21.89,0,0-13.28-7.56-19.65-26.12-6.36-18.57,5.18-24.82,5.18-24.82,0,0-11.54-9.56-13.13-28.27-1.6-18.71,21.09-41.39,21.09-41.39,0,0,.8-22.68,9.58-33.03,8.78-10.36,44.96-8.76,44.96-8.76,0,0-3.19-17.12,13.92-27.86,17.12-10.76,48.95,12.04,48.95,12.04,0,0,2.79-11.65,31.45-18.41,28.66-6.77,48.56,19.9,48.56,19.9,0,0,13.13-7.17,27.86,9.95,14.73,17.12,3.58,68.96,3.58,68.96,0,0,10.45,4.78,15.22,29.85,4.78,25.08-22.38,41.2-22.38,41.2Z" fill="#a1a1aa" opacity="0.25" />
        <path d="m550.93,363.14c-.43,0-.87-.04-1.31-.13-3.15-.62-5.36-3.29-5.36-6.5v-95.99c-7.77.28-18-.83-27.57-6.45-7.58-4.45-12.07-9.61-13.34-15.35-.73-3.31-.21-6.12.46-8.05-4.32-3.16-13.59-11.34-18.7-26.21-4.89-14.26,0-22.32,3.57-25.99-3.75-4.16-10.46-13.46-11.68-27.83-1.54-17.99,16.92-38.49,21.14-42.92.3-4.96,1.97-23.96,10.23-33.69,8.1-9.55,34.22-10.06,44-9.91-.07-6.12,1.69-18.6,15.57-27.31,15.61-9.81,40.88,4.7,49.41,10.21,3.05-4.51,11.08-12.04,31.9-16.96,26.05-6.16,44.93,13.07,50.2,19.23,4.9-1.53,16.65-2.98,29.19,11.58,13.97,16.24,6.6,59.45,4.65,69.5,3.67,2.79,11.01,10.67,14.82,30.7,4.5,23.59-16.39,39.43-22.31,43.39-.12,4.73-1.6,17.69-13.26,31.63-12.45,14.9-37.8,11.83-46.22,10.31-1.89,5.38-7.21,17.5-18.98,26.2-13.47,9.97-47.58,5.73-57.02,4.31l-33.31,82.09c-1.04,2.56-3.44,4.13-6.09,4.13Zm-.67-109.09v102.46c0,.17,0,.51.51.61.5.09.63-.22.69-.37l35.12-86.54,2.38.41c11.5,1.98,43.76,5.34,54.82-2.85,13.45-9.94,17.54-25.44,17.58-25.59l.73-2.85,2.87.67c.3.07,30.61,7.04,42.98-7.76,12.7-15.17,11.87-29.05,11.86-29.19l-.13-1.85,1.59-.96c.25-.15,25.29-15.38,20.97-38.06-4.34-22.82-13.48-27.66-13.57-27.71l-2.19-1,.56-2.33c3.01-14.02,8.36-53.27-2.92-66.37-12.83-14.91-23.72-9.5-24.18-9.26l-2.26,1.18-1.55-2.03c-.19-.25-19.11-25-45.46-18.77-25.94,6.13-29.21,16.17-29.24,16.27l-1.04,4.33-3.6-2.67c-8.41-6.01-32.99-19.87-45.61-11.94-15.09,9.47-12.68,24.16-12.57,24.78l.65,3.69-3.74-.15c-9.66-.42-36.12.13-42.54,7.7-8,9.42-8.86,30.98-8.87,31.2l-.04,1.18-.83.84c-.22.22-21.69,21.93-20.22,39.01,1.46,17.12,11.96,26.13,12.06,26.22l3.37,2.83-3.87,2.11c-.35.2-9.17,5.46-3.77,21.21,5.94,17.28,18.18,24.42,18.3,24.48l2.84,1.62-1.86,2.69c-.05.08-1.68,2.63-.83,6.24.93,3.94,4.55,7.87,10.49,11.35,9.61,5.64,20.14,6.08,27.27,5.44l3.26-.29Z" fill="#a1a1aa" />
        <ellipse cx="763.06" cy="128.5" rx="17.33" ry="20.6" fill="#a1a1aa" opacity="0.5" />
        <circle cx="679.5" cy="268.5" r="7.16" fill="#a1a1aa" opacity="0.5" />
        <circle cx="459.79" cy="181.34" r="18.51" fill="#a1a1aa" opacity="0.5" />
        <path d="m598.74,240.5c-2.55,0-5.15-.12-7.77-.28-7.69-.45-15.68-1.32-21.6-6.38-1.26-1.08-1.41-2.97-.33-4.23,1.08-1.26,2.97-1.41,4.23-.33,4.5,3.85,11.11,4.54,18.05,4.95,8.21.49,16.1.65,22.5-2.66,1.47-.76,3.28-.18,4.04,1.29.76,1.47.18,3.28-1.29,4.04-5.51,2.85-11.55,3.59-17.84,3.59Z" fill="#a1a1aa" opacity="0.5" />
        <path d="M643.17 243.47c-6.29 0-12.17-.93-17.6-2.79-13.55-4.65-23.77-15.69-26.04-28.14-.3-1.63.78-3.19 2.41-3.49 1.63-.3 3.19.78 3.49 2.41 1.89 10.34 10.56 19.58 22.09 23.54 9.86 3.38 21.54 3.29 34.72-.27 1.6-.43 3.25.51 3.68 2.11.43 1.6-.51 3.25-2.11 3.68-7.27 1.97-14.16 2.95-20.62 2.95zM500 111.21c-.62 0-1.24-.19-1.78-.59-1.33-.98-1.62-2.86-.63-4.2 5.52-7.47 13.85-11.05 19.87-12.74 7.43-2.09 15.09-2.49 22.49-2.89 1.66-.08 3.07 1.18 3.16 2.84.09 1.65-1.18 3.07-2.84 3.16-7.08.38-14.39.77-21.18 2.67-5.12 1.44-12.16 4.43-16.66 10.53-.59.8-1.5 1.22-2.42 1.22z" fill="#a1a1aa" opacity="0.5" />
        <path d="M531.98 114.25c-.25 0-.51-.03-.76-.1-1.6-.42-2.56-2.06-2.14-3.66 3.02-11.52 11.75-21.47 22.79-25.94 7.65-3.1 16.11-3.62 23.57-4.07 1.66-.09 3.08 1.16 3.18 2.81.1 1.65-1.16 3.08-2.81 3.18-7.34.45-14.94.91-21.68 3.64-9.32 3.78-16.69 12.17-19.24 21.91-.35 1.35-1.57 2.24-2.9 2.24zM644.51 131.79c-.17 0-.35-.02-.52-.05-1.63-.29-2.72-1.84-2.43-3.48.72-4.1-1.21-8.78-4.92-11.91-1.21-1.02-2.42-1.74-3.59-2.12-1.42-.47-3.06-.56-4.61-.59-4.1-.07-7.27.35-9.97 1.33-3.15 1.14-5.61 3.09-6.95 5.5-.8 1.45-2.63 1.97-4.08 1.17-1.45-.8-1.97-2.63-1.17-4.08 2.04-3.68 5.64-6.6 10.15-8.23 3.4-1.23 7.25-1.77 12.11-1.68 1.93.03 4.21.17 6.4.9 1.9.63 3.77 1.72 5.56 3.23 5.32 4.48 8.05 11.37 6.96 17.53-.26 1.46-1.52 2.48-2.95 2.48z" fill="#a1a1aa" opacity="0.5" />
        <path d="m620.95,169.03c-.28,0-.57-.04-.86-.13-1.59-.47-2.49-2.14-2.02-3.73,2.38-8,5.81-15.66,10.18-22.76,2.64-4.28,6.38-9.65,11.95-13.23,6.82-4.38,14.99-5.13,20.54-5.31,10.2-.33,24.41,1.23,34.17,10.62,1.19,1.15,1.23,3.05.08,4.24-1.15,1.19-3.05,1.23-4.24.08-8.25-7.94-20.77-9.25-29.82-8.95-7.69.25-13.25,1.64-17.49,4.36-3.56,2.28-6.67,5.78-10.09,11.33-4.1,6.66-7.31,13.83-9.54,21.33-.39,1.3-1.58,2.15-2.87,2.15Z" fill="#a1a1aa" opacity="0.5" />
        <path d="m688.35,154.3c-.28,0-.56-.04-.84-.12-1.59-.46-2.5-2.13-2.04-3.72,3.01-10.34,9.66-18.75,18.23-23.08,9.72-4.91,21.56-3.98,29.46,2.3,1.3,1.03,1.51,2.92.48,4.22-1.03,1.3-2.92,1.51-4.22.48-6-4.78-15.47-5.45-23.02-1.64-7.09,3.58-12.62,10.65-15.18,19.4-.38,1.31-1.58,2.16-2.88,2.16Z" fill="#a1a1aa" opacity="0.5" />
        <path d="m455.63,390.52c-.57,0-1.14-.16-1.65-.5-1.38-.91-1.76-2.77-.85-4.16,4.3-6.51,7.98-13.47,10.95-20.67.63-1.53,2.39-2.26,3.92-1.63,1.53.63,2.26,2.38,1.63,3.92-3.11,7.55-6.98,14.85-11.49,21.69-.58.87-1.53,1.35-2.51,1.35Zm18.11-44.12c-.19,0-.38-.02-.57-.05-1.63-.31-2.69-1.89-2.38-3.51,1.29-6.72,1.95-13.5,1.95-20.13,0-1.03-.02-2.06-.05-3.08-.05-1.66,1.25-3.04,2.91-3.09,1.64-.07,3.04,1.25,3.09,2.91.03,1.09.05,2.18.05,3.27,0,7.01-.69,14.17-2.06,21.26-.28,1.44-1.53,2.43-2.94,2.43Zm-1.67-47.53c-1.31,0-2.51-.86-2.88-2.18-2.12-7.44-5.19-14.61-9.12-21.31-.84-1.43-.36-3.27,1.07-4.11,1.43-.84,3.27-.36,4.11,1.07,4.19,7.14,7.46,14.77,9.72,22.7.45,1.59-.47,3.25-2.06,3.71-.28.08-.55.12-.83.12Zm-52.27-29.87c-1.52,0-2.82-1.15-2.98-2.7-.17-1.65,1.03-3.12,2.68-3.29,1.05-.11,2.03-.33,2.94-.66,6.52-2.39,8.78-10.22,9.45-13.47.18-.86.7-1.55,1.4-1.97-1.94-1.27-3.93-2.44-5.95-3.52-1.46-.78-2.02-2.59-1.24-4.06.78-1.46,2.59-2.02,4.06-1.24,7.2,3.82,13.91,8.77,19.94,14.72,1.18,1.16,1.19,3.06.03,4.24-1.16,1.18-3.06,1.19-4.24.03-2.57-2.54-5.28-4.88-8.1-7.02,0,0,0,.02,0,.03-1.85,8.96-6.68,15.49-13.27,17.9-1.37.5-2.85.84-4.39.99-.1.01-.21.02-.31.02Zm-20.52-9.97c-1.04,0-2.05-.54-2.61-1.51-.11-.19-.22-.38-.32-.58-1.36-2.57-2.07-5.49-2.07-8.47,0-4.54,1.71-8.79,4.7-11.65,1.66-1.59,3.65-2.78,5.9-3.53,1.57-.52,3.27.33,3.79,1.9.52,1.57-.33,3.27-1.9,3.79-1.4.46-2.62,1.19-3.64,2.16-1.81,1.74-2.85,4.41-2.85,7.32,0,2,.48,3.96,1.38,5.66.07.13.15.27.22.41.82,1.44.33,3.27-1.11,4.09-.47.27-.98.4-1.49.4Zm33.89-30.25c-1.29,0-2.48-.84-2.87-2.13-2.08-6.86-5.62-13.78-10.23-20.01l-.22-.3c-.99-1.33-.72-3.21.6-4.2,1.33-.99,3.21-.72,4.2.6l.24.32c5.02,6.77,8.88,14.32,11.15,21.84.48,1.59-.42,3.26-2,3.74-.29.09-.58.13-.87.13Zm-27.63-38.39c-.67,0-1.35-.22-1.9-.68-4.37-3.6-9.31-7.17-15.09-10.94-1.38-.9-2.77-1.78-4.18-2.65-1.41-.87-1.84-2.72-.97-4.13s2.72-1.84,4.13-.97c1.44.89,2.87,1.8,4.29,2.72,5.97,3.89,11.09,7.6,15.63,11.33,1.28,1.05,1.46,2.94.41,4.22-.59.72-1.45,1.09-2.32,1.09Zm-40.67-25.29c-.43,0-.86-.09-1.27-.28-7.33-3.43-14.72-6.31-21.96-8.54-1.58-.49-2.47-2.17-1.99-3.75.49-1.58,2.17-2.47,3.75-1.99,7.51,2.31,15.16,5.28,22.74,8.84,1.5.7,2.15,2.49,1.44,3.99-.51,1.09-1.59,1.73-2.72,1.73Zm-45.76-13.84c-.13,0-.26,0-.39-.03-6.09-.79-12.15-1.14-18.1-1-1.65.04-3.03-1.28-3.06-2.94-.04-1.66,1.28-3.03,2.94-3.06,6.25-.13,12.62.22,19,1.05,1.64.21,2.8,1.72,2.59,3.36-.2,1.51-1.49,2.61-2.97,2.61Z" fill="#a1a1aa" />
        <ellipse cx="234.38" cy="96.27" rx="41.25" ry="19.63" fill="#a1a1aa" opacity="0.5" transform="rotate(-72.5 234.386 96.27)" />
        <path d="m250.31,158.82c-4.28,0-8.66-.47-13.02-1.41-10.68-2.29-20.15-7.09-26.66-13.52-6.45-6.37-9.21-13.57-7.77-20.28,2.32-10.84,15.28-18.13,32.23-18.13,4.28,0,8.66.47,13.02,1.41,21.97,4.71,37.42,19.87,34.43,33.8-2.32,10.84-15.28,18.13-32.23,18.13Z" fill="#a1a1aa" opacity="0.5" />
        <path d="m235.09,104.98v1s0,0,0,0c4.25,0,8.59.47,12.92,1.4,21.7,4.65,36.97,19.54,34.05,33.2-2.27,10.61-15.03,17.73-31.74,17.73-4.25,0-8.59-.47-12.92-1.4-21.7-4.65-36.97-19.54-34.05-33.2,2.27-10.61,15.03-17.73,31.74-17.73v-1m0,0c-16.71,0-30.29,7.17-32.72,18.52-3.05,14.22,12.54,29.62,34.81,34.39,4.49.96,8.91,1.42,13.13,1.42,16.71,0,30.29-7.17,32.72-18.52,3.05-14.22-12.54-29.62-34.81-34.39-4.49-.96-8.91-1.42-13.13-1.42h0Z" fill="#a1a1aa" opacity="0.5" />
        <ellipse cx="242.7" cy="132.15" rx="26.33" ry="41.25" fill="#a1a1aa" transform="rotate(-77.91 242.686 132.157)" />
        <ellipse cx="249.6" cy="109.88" rx="41.25" ry="19.63" fill="#a1a1aa" opacity="0.5" transform="rotate(-38.47 249.567 109.89)" />
      </svg>
      <h6 className="text-center text-xl sm:text-2xl">سبد خرید شما خالی است!</h6>
    </div>
  );
};

export default Cart;