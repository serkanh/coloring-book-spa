import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure AWS SDK
const s3Options: AWS.S3.ClientConfiguration = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
};

// Use LocalStack endpoint in development
if (process.env.NODE_ENV === 'development' && process.env.AWS_ENDPOINT) {
  s3Options.endpoint = process.env.AWS_ENDPOINT;
  s3Options.s3ForcePathStyle = true; // Required for LocalStack
}

const s3 = new AWS.S3(s3Options);

// Order types
enum OrderType {
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
}

// Paper types
enum PaperType {
  THIN_MATTE = 'thin_matte',
  THICK_SHEEN = 'thick_sheen',
}

// Order status
enum OrderStatus {
  CREATED = 'created',
  PROCESSING = 'processing',
  PAYMENT_PENDING = 'payment_pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Mock database for orders
const orderDb: Record<string, any> = {};

export const orderController = {
  /**
   * Create a new order
   */
  createOrder: async (req: Request, res: Response) => {
    try {
      const {
        uploadId,
        orderType,
        paperType,
        shippingInfo
      } = req.body;

      if (!uploadId || !orderType) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Validate order type
      if (!Object.values(OrderType).includes(orderType)) {
        return res.status(400).json({ message: 'Invalid order type' });
      }

      // Validate that shipping info is provided for physical orders
      if (orderType === OrderType.PHYSICAL && !shippingInfo) {
        return res.status(400).json({ message: 'Shipping information is required for physical orders' });
      }

      // Validate paper type for physical orders
      if (orderType === OrderType.PHYSICAL && (!paperType || !Object.values(PaperType).includes(paperType))) {
        return res.status(400).json({ message: 'Valid paper type is required for physical orders' });
      }

      // Create order ID
      const orderId = uuidv4();
      const userId = req.user?.userId || 'anonymous';

      // Calculate prices
      const basePrice = orderType === OrderType.DIGITAL ? 9.99 : 19.99;
      const shippingPrice = orderType === OrderType.PHYSICAL ? 4.99 : 0;
      const total = basePrice + shippingPrice;

      // Create order object
      const order = {
        orderId,
        userId,
        uploadId,
        orderType,
        paperType: orderType === OrderType.PHYSICAL ? paperType : null,
        shippingInfo: orderType === OrderType.PHYSICAL ? shippingInfo : null,
        pricing: {
          basePrice,
          shippingPrice,
          total
        },
        status: OrderStatus.CREATED,
        pdfUrl: null, // To be populated after processing
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // In a real app, save to database
      // For now, save to our mock database
      orderDb[orderId] = order;

      return res.status(201).json({
        message: 'Order created successfully',
        order: {
          orderId,
          orderType,
          pricing: order.pricing,
          status: order.status,
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      return res.status(500).json({ message: 'Error creating order' });
    }
  },

  /**
   * Get user's orders
   */
  getUserOrders: async (req: Request, res: Response) => {
    try {
      const userId = req.user?.userId;

      // In a real app, query database for user's orders
      // For now, filter our mock database
      const userOrders = Object.values(orderDb).filter(
        (order: any) => order.userId === userId
      );

      return res.status(200).json({
        orders: userOrders.map(order => ({
          orderId: order.orderId,
          orderType: order.orderType,
          status: order.status,
          total: order.pricing.total,
          createdAt: order.createdAt
        }))
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Error fetching orders' });
    }
  },

  /**
   * Get order by ID
   */
  getOrderById: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.userId;

      // In a real app, query database for the order
      // For now, check our mock database
      const order = orderDb[orderId];

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check that the order belongs to the authenticated user
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to access this order' });
      }

      return res.status(200).json({ order });
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ message: 'Error fetching order' });
    }
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { status } = req.body;
      const userId = req.user?.userId;

      // Validate status
      if (!status || !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }

      // In a real app, query and update database
      // For now, check our mock database
      const order = orderDb[orderId];

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check that the order belongs to the authenticated user
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to update this order' });
      }

      // Update order
      order.status = status;
      order.updatedAt = new Date().toISOString();

      return res.status(200).json({
        message: 'Order status updated successfully',
        orderId,
        status,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      return res.status(500).json({ message: 'Error updating order status' });
    }
  },

  /**
   * Process payment for an order
   * This is a mock implementation
   */
  processPayment: async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { paymentMethod, cardDetails } = req.body;
      const userId = req.user?.userId;

      if (!paymentMethod) {
        return res.status(400).json({ message: 'Payment method is required' });
      }

      // In a real app, validate and process payment
      // For now, check our mock database
      const order = orderDb[orderId];

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check that the order belongs to the authenticated user
      if (order.userId !== userId) {
        return res.status(403).json({ message: 'Unauthorized to pay for this order' });
      }

      // Mock successful payment
      const paymentId = uuidv4();

      // Update order status
      order.status = OrderStatus.PAID;
      order.paymentId = paymentId;
      order.updatedAt = new Date().toISOString();

      return res.status(200).json({
        message: 'Payment processed successfully',
        orderId,
        paymentId,
        status: order.status,
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      return res.status(500).json({ message: 'Error processing payment' });
    }
  },
};
