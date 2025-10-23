import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from "react-router-dom";

import { Button, Layout, Menu, theme, List, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message } from 'antd';
import {
  MinusSquareFilled,
  PlusSquareOutlined,
  EditFilled,
  QuestionCircleOutlined,
  CaretUpOutlined,
  CaretDownOutlined,

} from '@ant-design/icons';
import DataTable from 'datatables.net-dt';
import { getFournisseurs, getProduits, API_URL } from "../services/api";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import axios from "axios";
import axiosInstance from '../services/axiosInstance';


const { Content } = Layout;



function AjouterFournisseur({ onFournisseurAdded }) {

  const [form] = Form.useForm();


  const [produits, setProduits] = useState([]);

  useEffect(() => {
    getProduits().then(setProduits);


    getProduits().catch(error => console.error("Erreur lors du chargement des produits :", error));
  }, [])


  const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
  };
  const validateMessages = {
    required: '${label} is required!',
    types: {
      email: '${label} is not a valid email!',
      number: '${label} is not a valid number!',
    },
    number: {
      range: '${label} must be between ${min} and ${max}',
    },
  };
  const onFinish = async (values) => {
    const { name, email, address, telephone, products, delay, jr_livraison } = values;
    console.log(values);
    let role = 'FOURNISSEUR'
    let delai_livraison = jr_livraison + ' 00:00:00';

    try {
      const response = await axiosInstance.post(`${API_URL}Suppliers/`, {
        name,
        email,
        address,
        telephone,
        // role,
        products,
        delay: parseInt(delay)
      });

      message.success("Fournisseur Enregistré avec succès !");
      form.resetFields();
      onFournisseurAdded(response.data);
      console.log('Fournisseur enregistré :', response.data);
    } catch (error) {
      message.error("Erreur lors de l’ajout du fournisseur !");
      console.error('Erreur lors de l’ajout', error);
    }
  };


  return (<Form
    {...layout}
    name="nest-messages"
    onFinish={onFinish}
    style={{ maxWidth: 600 }}
    validateMessages={validateMessages}
    form={form}
  >
    <fieldset>
      <legend> <h5>Ajouter un Fournisseur</h5> </legend>
      <Form.Item name='name' label="Nom" rules={[{ required: true }]} >
        <Input />
      </Form.Item>
      <Form.Item name='email' label="E-mail" rules={[{ required: true }]} >
        <Input />
      </Form.Item>
      <Form.Item name='address' label="Adresse" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item name='telephone' label="Téléphone" rules={[{ type: 'number', min: 0, required: true }]}>
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name='products' label="Produits" rules={[{ required: true }]}>
        <Select mode="multiple" placeholder="Sélectionnez des produits">
          {produits.map((produit) => (
            <Select.Option key={produit.id} value={produit.id} >{produit.name}</Select.Option>
          ))}

        </Select>
      </Form.Item>
      <Form.Item name='delay' label="Delai de livraison(jrs)" rules={[{ required: true }]}>
        <InputNumber min={1} placeholder="Ex: 3" />
      </Form.Item>

      <Form.Item label={null}>
        <Button type="primary" htmlType="submit" >
          Enregistrer Fournisseur
        </Button>
      </Form.Item>
    </fieldset>
  </Form>
  );
}



export function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);

  useEffect(() => {
    // Charger les données une seule fois
    getFournisseurs()
      .then(setFournisseurs)
      .catch((error) => console.error("Erreur lors du chargement des fournisseurs :", error));
  }, []);
  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nom', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Adresse', accessorKey: 'address' },
    { header: 'Téléphone', accessorKey: 'telephone' },
    /*{
      header: 'Liste de Produits',
      id: 'produits_details',
      cell: ({ row }) => {
        const produits = row.original.products || []; // tableau d’objets produits

        return (
          <div
            style={{
              maxHeight: '80px',        // hauteur maximale
              overflowY: 'auto',         // scroll vertical si dépasse
              paddingRight: '5px',       // un petit padding
            }}
          >
            <List
              size="small"
              dataSource={produits}
              renderItem={(item) => (
                <List.Item key={item.id} style={{ padding: '4px 0' }}>
                  <List.Item.Meta
                    title={<span>{item.name}</span>}
                  />
                </List.Item>
              )}
            />
          </div>
        );
      },
    },*/

    {
      header: 'Delais(jrs)',
      id: 'delai_livraison',
      cell: ({ row }) => (row.original.delay),
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Flex justify="space-evenly">
          <Popconfirm
            title="Suppression du Fournisseur"
            description="Êtes-vous sûr de vouloir supprimer ce Fournisseur ?"
            onConfirm={() => handleDelete(row.original.id)}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <MinusSquareFilled style={{color: 'red'}} />
          </Popconfirm>

          <NavLink to={`/fournisseur/${row.original.id}`}>
            <EditFilled />
          </NavLink>
        </Flex>
      ),
    },
  ];
  const table = useReactTable({
    data: fournisseurs,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,  // première page
        pageSize: 3,   // tu ne verras que 3 entrées
      }
    },
  });
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const [size, setSize] = useState('large');

  const [open, setOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [modalText, setModalText] = useState('Content of the modal');
  const showModal = () => {
    setOpen(true);
  };
  const handleOk = () => {
    setModalText('The modal will be closed after two seconds');
    setConfirmLoading(true);
    setTimeout(() => {
      setOpen(false);
      setConfirmLoading(false);
    }, 2000);
  };
  const handleCancel = () => {
    console.log('Clicked cancel button');
    setOpen(false);
  };

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`${API_URL}Suppliers/${id}/`);
      message.success("Fournisseur supprimé avec succès.");
      setFournisseurs(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      message.error("Erreur lors de la suppression du Fournisseur.");
    }
  };
  const cancel = e => {
    console.log(e);
    message.error('Click on No');
  };



  return (

    <>
      <div className="contentBody">
        <div className="produits">
          <h2>Table des fournisseurs</h2>
          {/* <Button color='#1677ff' variant="solid" icon={<PlusSquareOutlined />} size={size} onClick={showModal}>
                    Enregistrer un Fournisseur
                </Button> */}
          {/* <Button onClick={() => message.success("Test de message")}>Tester message</Button> */}

          {/* <Modal
                    title="Enregistrement de Fournisseur"
                    open={open}
                    onOk={handleOk}
                    confirmLoading={confirmLoading}
                    onCancel={handleCancel}
                > */}
          {/* <FormAjout /> */}
          {/* </Modal> */}
          <Input
            placeholder="Rechercher..."
            value={globalFilter || ''}
            onChange={e => setGlobalFilter(e.target.value)}
            style={{ marginBottom: '1rem', width: '300px' }}
          />


          <table className="table  table-hover">
            <caption>Liste des fournisseurs</caption>


            <thead className="table-light">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{ asc: <CaretUpOutlined />, desc: <CaretDownOutlined /> }[header.column.getIsSorted()] ?? null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {/* <tr>
                        <td>#2</td>
                        <td>Produit 2</td>
                        <td>Description Produit 2</td>
                        <td>Catégorie 2</td>
                        <td>80</td>
                        <td>8200 </td>
                        <td>7 </td>
                        <td>
                            <Flex align="flex-end" justify="space-evenly" >
                                <a title='Supprimer' >
                                    <MinusSquareFilled className='text-danger' />
                                </a>

                                <a title='Editer' >
                                    <EditFilled className='text-primary' />
                                </a>
                            </Flex>
                        </td>
                    </tr> */}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
            <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Précédent</Button>
            <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Suivant</Button>
            <span>
              Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
          </div>
        </div>

        <div className="addProduit">

          <AjouterFournisseur onFournisseurAdded={(newFournisseur) => setFournisseurs(prev => [...prev, newFournisseur])} />


        </div>
      </div>


    </>



  )
}