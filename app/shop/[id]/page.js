import ProductDetail from '@/components/ProductDetail';

export const metadata = { title: 'Product details' };

export default async function ProductPage({ params }) {
  const { id } = await params;
  return <ProductDetail id={Number(id)} />;
}
