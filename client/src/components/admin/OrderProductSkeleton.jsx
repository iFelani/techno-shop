const OrderProductSkeleton = () => {
  return (
    <tr className="border-t border-zinc-200 [&>*]:h-[120px] [&>*]:px-5">
      <td>
        <div className="h-24 w-40 animate-pulse rounded-3xl bg-skeleton"></div>
      </td>
      <td>
        <div className="h-6 w-full animate-pulse rounded-full bg-skeleton"></div>
      </td>
      <td>
        <div className="h-6 w-full animate-pulse rounded-full bg-skeleton"></div>
      </td>
      <td>
        <div className="h-6 w-full animate-pulse rounded-full bg-skeleton"></div>
      </td>
      <td>
        <div className="h-6 w-full animate-pulse rounded-full bg-skeleton"></div>
      </td>
      <td>
        <div className="h-6 w-full animate-pulse rounded-full bg-skeleton"></div>
      </td>
      <td>
        <div className="h-6 w-full animate-pulse rounded-full bg-skeleton"></div>
      </td>
      <td>
        <div className="h-6 w-full animate-pulse rounded-full bg-skeleton"></div>
      </td>
      <td>
        <div className="h-9 w-24 animate-pulse rounded-full bg-skeleton"></div>
      </td>
    </tr>
  );
};

export default OrderProductSkeleton;