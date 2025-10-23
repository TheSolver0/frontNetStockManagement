import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from "react-router-dom";

import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message } from 'antd';
import {
  MinusSquareFilled,
  PlusSquareOutlined,
  EditFilled,
  QuestionCircleOutlined,
  CaretUpOutlined,
  CaretDownOutlined,

} from '@ant-design/icons';
import DataTable from 'datatables.net-dt';
import { getClients, API_URL } from "../services/api";
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


function AjouterClient({ onClientAdded }) {

  const [form] = Form.useForm();

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
    const { name, email, address, telephone } = values;
    console.log(values);
    // let role = 'CLIENT'


    try {
      const response = await axiosInstance.post(`${API_URL}Customers/`, {
        name,
        email,
        address,
        telephone: parseInt(telephone, 10), 
        });

      message.success("Client Enregistré avec succès !");
      form.resetFields();
      onClientAdded(response.data);
      console.log('Client enregistré :', response.data);
    } catch (error) {
      message.error("Erreur lors de l’ajout du client !");
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
      <legend> <h5>Ajouter un Client</h5> </legend>
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


      <Form.Item label={null}>
        <Button type="primary" htmlType="submit" >
          Enregistrer Client
        </Button>
      </Form.Item>
    </fieldset>
  </Form>
  );
}



export function Clients() {
  const [clients, setClients] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);

  useEffect(() => {
    // Charger les données une seule fois
    getClients()
      .then(setClients)
      .catch((error) => console.error("Erreur lors du chargement des clients :", error));
  }, []);
  const columns = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Nom', accessorKey: 'name' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Adresse', accessorKey: 'address' },
    { header: 'Téléphone', accessorKey: 'telephone' },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Flex justify="space-evenly">
          <Popconfirm
            title="Suppression du client"
            description="Êtes-vous sûr de vouloir supprimer ce client ?"
            onConfirm={() => handleDelete(row.original.id)}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <MinusSquareFilled  style={{color:"red"}}/>
          </Popconfirm>

          <NavLink to={`/client/${row.original.id}`}>
            <EditFilled />
          </NavLink>
        </Flex>
      ),
    },
  ];
  const table = useReactTable({
    data: clients,
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
      await axiosInstance.delete(`${API_URL}Customers/${id}/`);
      message.success("Client supprimé avec succès.");
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      message.error("Erreur lors de la suppression du client.");
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
          <h2 >Clients</h2>
          {/* <Button color='#1677ff' variant="solid" icon={<PlusSquareOutlined />} size={size} onClick={showModal}>
                    Enregistrer un client
                </Button> */}
          {/* <Button onClick={() => message.success("Test de message")}>Tester message</Button> */}

          {/* <Modal
                    title="Enregistrement de client"
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

          
              <table className="table table-responsive  table-hover">
                <caption>Liste des Clients</caption>


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

              <AjouterClient onClientAdded={(newClient) => setClients(prev => [...prev, newClient])} />

            </div>
        </div>


      </>



      )
}