import React from 'react';
import { Button, Checkbox, Flex, Form, Input,message } from 'antd';
import axios from "axios";

const onFinish = async (values) => {
    console.log('Success:', values);
    const { email, password} = values;
    console.log(values);

    try {
        const response = await axios.post('http://localhost:8000/auth/login/', {
            email,
            password
        });
        localStorage.setItem("accessToken", response.data.access);
        // localStorage.setItem("username", response.data.user.nom);
        // localStorage.setItem("role", response.data.user.is_superuser);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("refreshToken", response.data.refresh);

        message.success("Nous sommes ravis de vous revoir!");
        window.location.href='/dashboard';

        console.log('connexion effectuée  :', response.data);
    } catch (error) {
        message.error("Erreur lors de l’ajout de la connexion !");
        console.error('Erreur lors de la connexion', error);
    }
};
const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
};
const Login = () => (
    <>
        <div className='contentcentre' > 
       <h1>Connexion</h1>
            <Form
                name="basic"
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                style={{ maxWidth: 600 }}
                initialValues={{ remember: true }}
                onFinish={onFinish}
                onFinishFailed={onFinishFailed}
                autoComplete="off"
            >
                <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ required: true, message: 'Veuillez entrer votre email!' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Password"
                    name="password"
                    rules={[{ required: true, message: 'Veuillez entrer votre mot de passe!' }]}
                >
                    <Input.Password />
                </Form.Item>

                <Form.Item name="remember" valuePropName="checked" label={null}>
                    <Checkbox>Remember me</Checkbox>
                </Form.Item>

                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">
                        Acceder à la plateforme
                    </Button>
                </Form.Item>
            </Form>
            </div>

    </>

);
export default Login;