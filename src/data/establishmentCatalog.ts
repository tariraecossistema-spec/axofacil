import { Establishment, ProductItem } from '../types/types';

export const DEFAULT_CATALOGS_BY_CATEGORY: Record<string, ProductItem[]> = {
  supermercado: [
    { id: 'def-s1', name: 'Arroz Doce 25Kg (Saco Superior)', priceMT: 1450, promoPriceMT: 1380, isPromo: true, isAvailable: true, stockQty: 85, category: 'Cereais & Mercearia', unitLabel: 'Saco 25kg', description: 'Arroz de grão longo e aromático ideal para famílias e revenda.', imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s2', name: 'Óleo Vegetal Sol 5 Litros', priceMT: 620, promoPriceMT: 580, isPromo: true, isAvailable: true, stockQty: 120, category: 'Mercearia', unitLabel: 'Garrafão 5L', description: 'Óleo 100% puro de girassol refinado.', imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s3', name: 'Açúcar Castanho de Moçambique 5Kg', priceMT: 390, isAvailable: true, stockQty: 150, category: 'Cereais & Mercearia', unitLabel: 'Pacote 5kg', description: 'Açúcar nacional de alta qualidade.', imageUrl: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s4', name: 'Farinha de Milho Top Score 10Kg', priceMT: 550, promoPriceMT: 510, isPromo: true, isAvailable: true, stockQty: 200, category: 'Cereais & Mercearia', unitLabel: 'Saco 10kg', description: 'Farinha de milho branca fortificada extra fina.', imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s5', name: 'Frango Inteiro Congelado (Caixa 10Unidades)', priceMT: 2200, isAvailable: true, stockQty: 45, category: 'Talho & Congelados', unitLabel: 'Caixa', description: 'Frango nacional limpo de alta qualidade.', imageUrl: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s6', name: 'Carne de Vaca Fresca para Grelhar (Kg)', priceMT: 480, isAvailable: true, stockQty: 60, category: 'Talho & Congelados', unitLabel: 'Kg', description: 'Corte nobre de novilho de pasto moçambicano.', imageUrl: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s7', name: 'Leite UHT Parmalat Integral (Caixa 12x1L)', priceMT: 1180, isAvailable: true, stockQty: 90, category: 'Lacticínios', unitLabel: 'Caixa 12L', description: 'Leite integral UHT rico em cálcio.', imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s8', name: 'Esparguete Santa Amália 500g', priceMT: 75, promoPriceMT: 65, isPromo: true, isAvailable: true, stockQty: 180, category: 'Cereais & Mercearia', unitLabel: 'Pacote 500g', description: 'Massa esparguete de sêmola de trigo de alta qualidade.', imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s9', name: 'Feijão Manteiga Nacional 1Kg', priceMT: 130, isAvailable: true, stockQty: 140, category: 'Cereais & Mercearia', unitLabel: 'Kg', description: 'Feijão manteiga macio e selecionado para caril e feijoadas.', imageUrl: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s10', name: 'Cartela de Ovos Frescos de Granja (30 Un)', priceMT: 350, promoPriceMT: 320, isPromo: true, isAvailable: true, stockQty: 75, category: 'Lacticínios & Ovos', unitLabel: 'Cartela 30un', description: 'Ovos médios frescos de produção avícola nacional.', imageUrl: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s11', name: 'Leite Condensado Nestlé Moça 395g', priceMT: 115, isAvailable: true, stockQty: 110, category: 'Mercearia Doce', unitLabel: 'Lata 395g', description: 'Ideal para sobremesas, bolos, café e doces tradicionais.', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s12', name: 'Sumo 100% Ceres Laranja / Frutas (1 Litro)', priceMT: 145, isAvailable: true, stockQty: 95, category: 'Bebidas & Sumos', unitLabel: 'TetraPak 1L', description: 'Sumo natural puro sem adição de açúcares.', imageUrl: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s13', name: 'Sabão em Barra Maciço 1Kg (Caixa 25 un)', priceMT: 950, isAvailable: true, stockQty: 40, category: 'Higiene & Limpeza', unitLabel: 'Caixa', description: 'Sabão azul/branco multiuso para lavagem e limpeza doméstica.', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-s14', name: 'Detergente OMO Multi Ação 2Kg', priceMT: 380, isAvailable: true, stockQty: 65, category: 'Higiene & Limpeza', unitLabel: 'Pacote 2kg', description: 'Detergente em pó com alto poder de remoção de manchas.', imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80' }
  ],
  loja: [
    { id: 'def-l1', name: 'Camisa Formal Masculina Algodão Premium', priceMT: 1200, promoPriceMT: 990, isPromo: true, isAvailable: true, stockQty: 35, category: 'Vestuário Masculino', unitLabel: 'Unidade', description: 'Corte slim fit em algodão 100% respirável.', imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l2', name: 'Vestido de Festa Elegante em Seda', priceMT: 2800, promoPriceMT: 2400, isPromo: true, isAvailable: true, stockQty: 20, category: 'Vestuário Feminino', unitLabel: 'Unidade', description: 'Design exclusivo com tecido de toque suave.', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l3', name: 'Sapatilhas Desportivas Urbanas', priceMT: 2500, isAvailable: true, stockQty: 40, category: 'Calçado', unitLabel: 'Par', description: 'Solado acolchoado antiderrapante para o dia-a-dia.', imageUrl: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l4', name: 'Calça Jeans Casual Estonada', priceMT: 1500, isAvailable: true, stockQty: 50, category: 'Moda', unitLabel: 'Unidade', description: 'Jeans de alta durabilidade com elastano.', imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l5', name: 'Kit Meias de Algodão (Embalagem 6 Pares)', priceMT: 450, promoPriceMT: 380, isPromo: true, isAvailable: true, stockQty: 100, category: 'Acessórios & Meias', unitLabel: 'Pacote 6 un', description: 'Meias macias reforçadas nos calcanhares.', imageUrl: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l6', name: 'Mala / Mochila para Computador 15.6"', priceMT: 1800, isAvailable: true, stockQty: 25, category: 'Acessórios', unitLabel: 'Unidade', description: 'Mochila impermeável com compartimento acolchoado.', imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l7', name: 'Capulana Moçambicana Autêntica 100% Algodão', priceMT: 650, promoPriceMT: 550, isPromo: true, isAvailable: true, stockQty: 60, category: 'Tecidos Tradicionais', unitLabel: 'Peça (2 metros)', description: 'Padrão tradicional africano com cores vivas e alta resistência.', imageUrl: 'https://images.unsplash.com/photo-1528458876885-544243324950?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l8', name: 'Relógio de Pulso Quartz Analógico Masculino', priceMT: 2200, isAvailable: true, stockQty: 18, category: 'Relógios & Jóias', unitLabel: 'Unidade', description: 'Caixa em aço inoxidável e bracelete em couro genuíno.', imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l9', name: 'Óculos de Sol Polarizados UV400 Elegance', priceMT: 1400, isAvailable: true, stockQty: 30, category: 'Acessórios', unitLabel: 'Unidade', description: 'Proteção total UV400 com lentes polarizadas anti-reflexo.', imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-l10', name: 'Perfume Silver Scent Jacques Bogart 100ml', priceMT: 3100, promoPriceMT: 2800, isPromo: true, isAvailable: true, stockQty: 15, category: 'Perfumaria & Cosméticos', unitLabel: 'Frasco 100ml', description: 'Fragrância marcante amadeirada e oriental de longa fixação.', imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80' }
  ],
  bar: [
    { id: 'def-b1', name: 'Cerveja 2M 500ml Gelada (Gradinha 24Un)', priceMT: 2400, promoPriceMT: 2200, isPromo: true, isAvailable: true, stockQty: 30, category: 'Cervejas', unitLabel: 'Gradinha 24un', description: 'A cerveja preferida de Moçambique, servida estalando de gelada.', imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b2', name: 'Cerveja Laurentina Preta 330ml (Caixa 24Un)', priceMT: 2600, isAvailable: true, stockQty: 25, category: 'Cervejas', unitLabel: 'Caixa 24un', description: 'Cerveja escura encorpada de sabor premiado.', imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b3', name: 'Whisky Johnnie Walker Black Label 1L', priceMT: 3200, promoPriceMT: 2900, isPromo: true, isAvailable: true, stockQty: 15, category: 'Destilados', unitLabel: 'Garrafa 1L', description: 'Whisky escocês envelhecido 12 anos.', imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b4', name: 'Tábua Mistura de Mariscos & Camarão Grelhado', priceMT: 1800, isAvailable: true, stockQty: 20, category: 'Petiscos & Cozinha', unitLabel: 'Dose Grande', description: 'Camarão da Costa, lulas e amêijoas salteadas ao alho e piripíri.', imageUrl: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b5', name: 'Frango a Zambeziana com Batata Frita', priceMT: 850, isAvailable: true, stockQty: 35, category: 'Refeições', unitLabel: 'Prato', description: 'Frango marinado no leite de coco, alho e piripíri grelhado na brasa.', imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b6', name: 'Cerveja Laurentina Clara 500ml Gelada', priceMT: 120, isAvailable: true, stockQty: 80, category: 'Cervejas', unitLabel: 'Garrafa', description: 'A mais antiga cerveja de Moçambique, leve e refrescante.', imageUrl: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b7', name: 'Cerveja Manica 500ml Gelada', priceMT: 110, isAvailable: true, stockQty: 70, category: 'Cervejas', unitLabel: 'Garrafa', description: 'Cerveja dourada de corpo pleno, clássica moçambicana.', imageUrl: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b8', name: 'Sidra Savanna Dry 330ml com Limão', priceMT: 150, promoPriceMT: 135, isPromo: true, isAvailable: true, stockQty: 60, category: 'Cervejas & Sidras', unitLabel: 'Garrafa', description: 'Sidra de maçã crocante com rodela de limão.', imageUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b9', name: 'Caipirinha Especial de Lima', priceMT: 250, isAvailable: true, stockQty: 50, category: 'Cocktails', unitLabel: 'Copo', description: 'Lima fresca macerada, açúcar e cachaça servida com gelo picado.', imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b10', name: 'Gin Gordons Tónico com Zimbro', priceMT: 300, isAvailable: true, stockQty: 45, category: 'Cocktails', unitLabel: 'Copo', description: 'Gin Gordon London Dry, água tónica Schweppes, bagas de zimbro e limão.', imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b11', name: 'Refrigerante Coca-Cola 330ml Lata', priceMT: 60, isAvailable: true, stockQty: 120, category: 'Refrigerantes', unitLabel: 'Lata', description: 'Coca-Cola original bem gelada.', imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b12', name: 'Água Mineral Vumba 500ml', priceMT: 50, isAvailable: true, stockQty: 150, category: 'Refrigerantes & Águas', unitLabel: 'Garrafa', description: 'Água pura mineral das nascentes de Manica.', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b13', name: 'Asinhas de Frango Picantes com Batata Frita', priceMT: 550, isAvailable: true, stockQty: 30, category: 'Petiscos & Cozinha', unitLabel: 'Dose', description: 'Asas crocantes regadas a molho especial peri-peri da casa.', imageUrl: 'https://images.unsplash.com/photo-1527477378408-1bc0a6042063?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-b14', name: 'Chamuças Mistas de Carne & Vegetais (Dose 6 un)', priceMT: 240, promoPriceMT: 200, isPromo: true, isAvailable: true, stockQty: 40, category: 'Petiscos & Cozinha', unitLabel: 'Dose 6un', description: 'Chamuças estaladiças feitas na hora com recheio temperado.', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80' }
  ],
  hospedagem: [
    { id: 'def-h1', name: 'Quarto Executivo Casal com Vista Mar', priceMT: 3500, promoPriceMT: 2950, isPromo: true, isAvailable: true, stockQty: 8, category: 'Suítes & Alojamento', unitLabel: 'Diária', description: 'Ar condicionado, TV Cabo, Wi-Fi Fibra, Varanda e Pequeno-almoço incluído.', imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-h2', name: 'Quarto Standard Duplo (2 Camas Solteiro)', priceMT: 2400, isAvailable: true, stockQty: 12, category: 'Alojamento', unitLabel: 'Diária', description: 'Quarto acolhedor com casa de banho privativa e ar condicionado.', imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-h3', name: 'Suíte Presidencial com Jacuzzi Privativo', priceMT: 6500, promoPriceMT: 5800, isPromo: true, isAvailable: true, stockQty: 3, category: 'Suítes VIP', unitLabel: 'Diária', description: 'Suíte espaçosa com sala de estar, jacuzzi e serviço de quarto 24h.', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-h4', name: 'Serviço de Transfer Aeroporto (Ida e Volta)', priceMT: 1500, isAvailable: true, stockQty: 10, category: 'Serviços Adicionais', unitLabel: 'Serviço', description: 'Viatura executiva com motorista credenciado.', imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-h5', name: 'Bungalow Familiar com Cozinha Equipada', priceMT: 4800, isAvailable: true, stockQty: 6, category: 'Alojamento', unitLabel: 'Diária', description: 'Capacidade para 4 a 6 pessoas com sala, kitchenette e varanda ajardinada.', imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-h6', name: 'Pequeno-Almoço Buffet Continental (Hóspede Extra)', priceMT: 650, isAvailable: true, stockQty: 30, category: 'Refeições', unitLabel: 'Por pessoa', description: 'Pães artesanais, frutas tropicais, sumos, ovos, queijos e café expresso.', imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80' }
  ],
  construcao: [
    { id: 'def-c1', name: 'Cimento Limpopo 42.5N (Saco 50kg)', priceMT: 490, promoPriceMT: 465, isPromo: true, isAvailable: true, stockQty: 500, category: 'Cimento', unitLabel: 'Saco (50kg)', description: 'Cimento de alta resistência para betão e fundações.', imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-c2', name: 'Chapa de Zinco Canelada 0.40mm (3.6m)', priceMT: 780, promoPriceMT: 720, isPromo: true, isAvailable: true, stockQty: 250, category: 'Cobertura', unitLabel: 'Chapa', description: 'Chapa galvanizada durável e resistente à corrosão marinha.', imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-c3', name: 'Varão de Aço Nervurado 12mm (Vara 6m)', priceMT: 520, isAvailable: true, stockQty: 400, category: 'Estruturas', unitLabel: 'Vara (6m)', description: 'Aço estrutural certificado para pilares e vigas.', imageUrl: 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-c4', name: 'Blocos de Cimento Vibrados 15cm (Centena)', priceMT: 4800, isAvailable: true, stockQty: 60, category: 'Blocos & Alvenaria', unitLabel: 'Centena (100un)', description: 'Blocos industriais de alta densidade.', imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-c5', name: 'Carrada de Areia Grossa de Rio (Camião 10m³)', priceMT: 8500, isAvailable: true, stockQty: 15, category: 'Agregados', unitLabel: 'Carrada (10m³)', description: 'Areia lavada para betonagem de lajes e pilares.', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-c6', name: 'Brita nº 1 de Pedreira (Metro Cúbico m³)', priceMT: 1250, isAvailable: true, stockQty: 80, category: 'Agregados', unitLabel: 'Metro Cúbico (m³)', description: 'Pedra britada limpa para preparação de betão estrutural.', imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-c7', name: 'Tinta Acrílica Lavável Branca 20L', priceMT: 3200, promoPriceMT: 2900, isPromo: true, isAvailable: true, stockQty: 45, category: 'Tintas & Acabamentos', unitLabel: 'Balde 20L', description: 'Tinta acrílica exterior e interior resistente à humidade e sol.', imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80' }
  ],
  pecas_auto: [
    { id: 'def-pa1', name: 'Óleo Sintético Shell Helix Ultra 5W40 (5L)', priceMT: 2800, promoPriceMT: 2450, isPromo: true, isAvailable: true, stockQty: 60, category: 'Lubrificantes', unitLabel: 'Garrafão 5L', description: 'Óleo sintético de alta proteção contra desgaste do motor.', imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-pa2', name: 'Bateria Willard 12V 70Ah (Garantia 12 Meses)', priceMT: 6500, promoPriceMT: 5800, isPromo: true, isAvailable: true, stockQty: 25, category: 'Baterias', unitLabel: 'Unidade', description: 'Bateria de alta capacidade de arranque a frio.', imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-pa3', name: 'Jogo de Calços de Travão Frente Toyota Hilux/Fortuner', priceMT: 1950, isAvailable: true, stockQty: 40, category: 'Travões', unitLabel: 'Jogo completo', description: 'Calços cerâmicos de travagem progressiva e silenciosa.', imageUrl: 'https://images.unsplash.com/photo-1600706432520-256f66eeaf4c?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-pa4', name: 'Amortecedores Traseiros Monroe Heavy Duty (Par)', priceMT: 5400, isAvailable: true, stockQty: 18, category: 'Suspensão', unitLabel: 'Par', description: 'Amortecedores reforçados para estradas difíceis.', imageUrl: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-pa5', name: 'Filtro de Óleo + Filtro de Ar Toyota Fit/Ractis', priceMT: 1200, isAvailable: true, stockQty: 80, category: 'Filtros', unitLabel: 'Kit', description: 'Kit de manutenção preventiva de alta filtragem.', imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=600&q=80' },
    { id: 'def-pa6', name: 'Velas de Ignição NGK Iridium (Jogo 4un)', priceMT: 1800, isAvailable: true, stockQty: 50, category: 'Motor & Ignição', unitLabel: 'Jogo 4un', description: 'Velas de alta eficiência na combustão e economia de combustível.', imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80' }
  ],
  turismo: [
    {
      id: 'def-tur-1',
      name: 'Pacote Itália & Vaticano — 7 dias / 6 noites',
      priceMT: 185000,
      category: 'Turismo Internacional',
      description: 'Pacote internacional completo: passagens aéreas, hotéis selecionados, pequeno-almoço, city tours e guias locais no Vaticano e Coliseu.',
      imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
      tourismType: 'internacional',
      destination: 'Roma & Vaticano, Itália',
      originCity: 'Maputo',
      durationLabel: '7 dias / 6 noites',
      includesTransport: true,
      includesLodging: true,
      includesMeals: true,
      includesGuide: true,
      includesAirportPickup: true,
      isAvailable: true,
      stockQty: 20,
      unitLabel: 'Por pessoa'
    },
    {
      id: 'def-tur-2',
      name: 'Roteiro Ponta do Ouro & Reserva Especial — Fim de Semana',
      priceMT: 8500,
      category: 'Turismo Doméstico',
      description: 'Transporte próprio em minibus executivo climatizado, estadia em lodge parceiro, mergulho e safári com guias dedicados.',
      imageUrl: 'https://images.unsplash.com/photo-1591192969450-4e5a5d8b1a1f?auto=format&fit=crop&w=600&q=80',
      tourismType: 'domestico',
      destination: 'Ponta do Ouro & Reserva de Elefantes',
      originCity: 'Maputo',
      durationLabel: '3 dias / 2 noites',
      includesTransport: true,
      includesLodging: true,
      includesGuide: true,
      isAvailable: true,
      stockQty: 30,
      unitLabel: 'Por pessoa'
    },
    {
      id: 'def-tur-3',
      name: 'Peregrinação Religiosa ao Vaticano & Terra Santa',
      priceMT: 245000,
      category: 'Turismo Religioso',
      description: 'Roteiro de fé com acompanhamento de guia espiritual, missas nos principais santuários e acolhimento nos aeroportos.',
      imageUrl: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=600&q=80',
      tourismType: 'religioso',
      destination: 'Vaticano, Roma & Santuários',
      durationLabel: '10 dias / 9 noites',
      includesTransport: true,
      includesLodging: true,
      includesMeals: true,
      includesGuide: true,
      includesAirportPickup: true,
      isAvailable: true,
      stockQty: 25,
      unitLabel: 'Por pessoa'
    },
    {
      id: 'def-tur-4',
      name: 'Bilhete Aéreo Internacional Maputo ↔ Europa / África do Sul',
      priceMT: 92000,
      category: 'Bilhetes & Reservas',
      description: 'Emissão imediata de passagens aéreas com gestão de bagagem, escolha de assento e assistência aeroportuária.',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
      tourismType: 'bilhete',
      destination: 'Europa / Joanesburgo / Dubai',
      originCity: 'Maputo (MPM)',
      isAvailable: true,
      stockQty: 50,
      unitLabel: 'Bilhete'
    },
    {
      id: 'def-tur-5',
      name: 'Logística Axofácil! — Entrega & Carga Entre Lojas (Maputo/Matola/Boane)',
      priceMT: 450,
      category: 'Logística & Entregas',
      description: 'Serviço de frete e transporte rápido entre lojas, estaleiros, bares e supermercados do Axofácil!, aproveitando a frota comercial da agência.',
      imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80',
      tourismType: 'logistica',
      destination: 'Maputo, Matola & Boane',
      includesTransport: true,
      isAvailable: true,
      stockQty: 100,
      unitLabel: 'Por percurso'
    }
  ]
};

export function ensureEstablishmentCatalog(est: Establishment): Establishment {
  const rawCatalog = Array.isArray(est.productsCatalog)
    ? est.productsCatalog
    : Array.isArray(est.products)
    ? est.products
    : [];

  const updatedCatalog: ProductItem[] = rawCatalog.map((item, idx) => ({
    ...item,
    id: item.id ? (item.id.startsWith(`${est.id}-`) || item.id.startsWith('prod') ? item.id : `${est.id}-${item.id}`) : `${est.id}-prod-${idx}`,
    stockQty: item.stockQty !== undefined ? item.stockQty : 35 + (idx * 5),
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
  }));

  return ensureEstablishmentCoordinates({
    ...est,
    products: updatedCatalog,
    productsCatalog: updatedCatalog
  });
}

export function ensureEstablishmentCoordinates(est: Establishment): Establishment {
  if (est.latitude && est.longitude && !isNaN(est.latitude) && !isNaN(est.longitude)) {
    return est;
  }

  // Zone / Province based fallback coordinates
  const zoneLower = (est.zone || '').toLowerCase() + ' ' + (est.address || '').toLowerCase() + ' ' + (est.province || '').toLowerCase();

  let lat = -25.9692; // Default Maputo Baixa
  let lng = 32.5732;

  if (zoneLower.includes('matola')) {
    lat = -25.9615;
    lng = 32.4589;
  } else if (zoneLower.includes('zimpeto') || zoneLower.includes('magoanine')) {
    lat = -25.8202;
    lng = 32.4632;
  } else if (zoneLower.includes('costa do sol') || zoneLower.includes('triunfo') || zoneLower.includes('marés')) {
    lat = -25.9380;
    lng = 32.6180;
  } else if (zoneLower.includes('polana') || zoneLower.includes('sommerchield')) {
    lat = -25.9610;
    lng = 32.5930;
  } else if (zoneLower.includes('alto maé') || zoneLower.includes('alto mae')) {
    lat = -25.9550;
    lng = 32.5700;
  } else if (zoneLower.includes('boane')) {
    lat = -25.9222;
    lng = 32.3278;
  } else if (zoneLower.includes('xipamanine')) {
    lat = -25.9450;
    lng = 32.5550;
  } else if (zoneLower.includes('beira') || zoneLower.includes('sofala')) {
    lat = -19.8436;
    lng = 34.8389;
  } else if (zoneLower.includes('nampula')) {
    lat = -15.1165;
    lng = 39.2666;
  }

  return {
    ...est,
    latitude: lat,
    longitude: lng,
    addressText: est.addressText || est.address
  };
}
