import React from 'react';
import { Row, Col, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../../../../components/client/ProductCard/ProductCard';
import { useCart } from '../../../../contexts/CartContext';
import '../styles/ProductList.scss';

const ProductList = ({ products }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleAddToCart = async (product) => {
    try {
      const result = await addToCart(product._id, 1);
      if (result.success) {
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Lỗi khi thêm vào giỏ hàng:', error);
      message.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại sau!');
      return { success: false };
    }
  };

  const handleAddToWishlist = (product) => {
    message.success(`Đã thêm ${product.name} vào danh sách yêu thích!`);
  };

  return (
    <Row gutter={[12, 20]} className="products-grid">
      {products.map(product => (
        <Col
          key={product._id}
          xs={24}
          sm={12}
          md={8}
          lg={6}
          xl={6}
          className="product-column"
        >
          <ProductCard
            product={product}
            onAddToCart={handleAddToCart}
            onAddToWishlist={handleAddToWishlist}
            imageHeight={220}
            onProductClick={() => navigate(`/products/${product.slug}`)}
          />
        </Col>
      ))}
    </Row>
  );
};

export default ProductList;