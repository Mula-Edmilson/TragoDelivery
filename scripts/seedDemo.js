const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { User, DriverProfile, Client, Order, CompanyCost } = require('../backend/models');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trago_delivery');
    console.log('Ligação ao MongoDB estabelecida para o Seed.');

    // Limpar coleções
    await User.deleteMany({});
    await DriverProfile.deleteMany({});
    await Client.deleteMany({});
    await Order.deleteMany({});
    await CompanyCost.deleteMany({});

    console.log('Coleções limpas com sucesso.');

    const hashedPasswordAdmin = await bcrypt.hash('admin123', 12);
    const hashedPasswordDriver = await bcrypt.hash('driver123', 12);
    const hashedPasswordManager = await bcrypt.hash('gestor123', 12);

    // ==================================================
    // 1. UTILIZADORES OBRIGATÓRIOS
    // ==================================================
    const admin = await User.create({
      nome: 'Administrador Trago',
      email: 'admin@tragodelivery.co.mz',
      telefone: '+258840000001',
      password: hashedPasswordAdmin,
      role: 'admin'
    });

    const driverCarlos = await User.create({
      nome: 'Carlos Motorista',
      email: 'carlos@tragodelivery.co.mz',
      telefone: '+258840000002',
      password: hashedPasswordDriver,
      role: 'driver'
    });

    const manager = await User.create({
      nome: 'Gestor Operacional',
      email: 'gestor@tragodelivery.co.mz',
      telefone: '+258840000003',
      password: hashedPasswordManager,
      role: 'manager'
    });

    // Outros 2 Motoristas
    const driver2 = await User.create({
      nome: 'João Silva',
      email: 'joao@tragodelivery.co.mz',
      telefone: '+258840000004',
      password: hashedPasswordDriver,
      role: 'driver'
    });

    const driver3 = await User.create({
      nome: 'Mário Costa',
      email: 'mario@tragodelivery.co.mz',
      telefone: '+258840000005',
      password: hashedPasswordDriver,
      role: 'driver'
    });

    // ==================================================
    // 2. PERFIS DE MOTORISTAS
    // ==================================================
    const profileCarlos = await DriverProfile.create({
      user: driverCarlos._id,
      vehicle_plate: 'MMQ-12-34',
      status: 'online_livre',
      commissionRate: 20,
      lastLocation: {
        lat: -25.9653,
        lng: 32.5890,
        accuracy: 10,
        speed: 0,
        updatedAt: new Date()
      }
    });

    const profile2 = await DriverProfile.create({
      user: driver2._id,
      vehicle_plate: 'MMQ-56-78',
      status: 'online_ocupado',
      commissionRate: 20,
      lastLocation: {
        lat: -25.9530,
        lng: 32.5800,
        accuracy: 12,
        speed: 25,
        updatedAt: new Date()
      }
    });

    await DriverProfile.create({
      user: driver3._id,
      vehicle_plate: 'MMQ-90-12',
      status: 'offline',
      commissionRate: 25
    });

    // ==================================================
    // 3. CLIENTES
    // ==================================================
    const client1 = await Client.create({
      nome: 'Farmácia Saúde',
      telefone: '+258841111111',
      email: 'contacto@farmaciasaude.co.mz',
      empresa: 'Farmácia Saúde Lda',
      nuit: '400111222',
      endereco: 'Av. 24 de Julho, Maputo',
      created_by_admin: admin._id
    });

    const client2 = await Client.create({
      nome: 'Restaurante PiriPiri',
      telefone: '+258842222222',
      email: 'encomendas@piripiri.co.mz',
      empresa: 'Restaurante PiriPiri MZ',
      nuit: '400333444',
      endereco: 'Av. Julius Nyerere, Maputo',
      created_by_admin: admin._id
    });

    const client3 = await Client.create({
      nome: 'Tech Store',
      telefone: '+258843333333',
      email: 'vendas@techstore.co.mz',
      empresa: 'Tech Store Moçambique',
      nuit: '400555666',
      endereco: 'Av. Eduardo Mondlane, Maputo',
      created_by_admin: admin._id
    });

    // ==================================================
    // 4. ENCOMENDAS
    // ==================================================
    // Encomenda Pendente
    await Order.create({
      service_type: 'rapido',
      price: 450,
      client_name: client1.nome,
      client_phone1: client1.telefone,
      address_text: 'Av. Mao Tse Tung, 120 - Maputo',
      address_coords: { lat: -25.9680, lng: 32.5850 },
      verification_code: 'A1B2C',
      created_by_admin: admin._id,
      client: client1._id,
      status: 'pendente',
      payment_method: 'mpesa'
    });

    // Encomenda Atribuída ao Carlos
    await Order.create({
      service_type: 'farma',
      price: 600,
      client_name: client1.nome,
      client_phone1: client1.telefone,
      address_text: 'Bairro da Coop, Rua A - Maputo',
      address_coords: { lat: -25.9600, lng: 32.5900 },
      verification_code: 'X9Y8Z',
      created_by_admin: admin._id,
      assigned_to_driver: profileCarlos._id,
      client: client1._id,
      status: 'atribuido',
      payment_method: 'cash'
    });

    // Encomenda em Recolha pelo João
    await Order.create({
      service_type: 'carga',
      price: 1200,
      client_name: client2.nome,
      client_phone1: client2.telefone,
      address_text: 'Sommerschield, Perto do Parque - Maputo',
      address_coords: { lat: -25.9500, lng: 32.5950 },
      verification_code: 'M4N5P',
      created_by_admin: admin._id,
      assigned_to_driver: profile2._id,
      client: client2._id,
      status: 'recolha_em_progresso',
      payment_method: 'emola',
      timestamp_started: new Date()
    });

    // Encomenda Concluída
    await Order.create({
      service_type: 'doc',
      price: 300,
      client_name: client3.nome,
      client_phone1: client3.telefone,
      address_text: 'Baixa de Maputo, Rua Consiglieri Pedroso',
      address_coords: { lat: -25.9750, lng: 32.5700 },
      verification_code: 'OK123',
      created_by_admin: admin._id,
      assigned_to_driver: profileCarlos._id,
      client: client3._id,
      status: 'concluido',
      payment_method: 'cash',
      timestamp_started: new Date(Date.now() - 2 * 3600 * 1000),
      timestamp_completed: new Date(Date.now() - 1 * 3600 * 1000),
      valor_motorista: 60,
      valor_empresa: 240
    });

    // ==================================================
    // 5. CUSTOS
    // ==================================================
    await CompanyCost.create({
      category: 'combustivel',
      description: 'Abastecimento Frota Maputo',
      amount: 5000,
      date: new Date(),
      createdBy: admin._id
    });

    await CompanyCost.create({
      category: 'salarios',
      description: 'Adiantamento Motoristas',
      amount: 15000,
      date: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      createdBy: admin._id
    });

    console.log('==================================================');
    console.log('SEED FINALIZADO COM SUCESSO!');
    console.log('Contas criadas:');
    console.log('Admin: admin@tragodelivery.co.mz | Senha: admin123');
    console.log('Motorista: carlos@tragodelivery.co.mz | Senha: driver123');
    console.log('Gestor: gestor@tragodelivery.co.mz | Senha: gestor123');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  }
};

seedDB();
