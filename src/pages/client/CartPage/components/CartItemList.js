import React from 'react';
import { List, Skeleton, Empty } from 'antd';
import CartItem from './CartItem';
import '../styles/CartItemList.scss';

const CartItemList = ({ items, onUpdateQuantity, onRemoveItem, loading }) => {
  // Hiển thị trạng thái rỗng khi không có sản phẩm nhưng không đang loading
  const showEmpty = !loading && (!items || items.length === 0);

  return (
    <div className="cart-item-list">
      {showEmpty ? (
        <div className="empty-placeholder">
          Không có sản phẩm nào trong giỏ hàng
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={items || []}
          renderItem={(item) => (
            <List.Item className="cart-list-item">
              <Skeleton
                loading={loading}
                active
                avatar
                paragraph={{ rows: 1 }}
                className="cart-item-skeleton"
              >
                <CartItem
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                  loading={loading}
                />
              </Skeleton>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default CartItemList;