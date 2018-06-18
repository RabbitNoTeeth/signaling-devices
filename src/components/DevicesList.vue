<template>
    <div>
        <div class="header">
            <span class="header_font"><Icon type="navicon-round"></Icon>&nbsp;设备列表</span>
        </div>

        <div class="content">
            <!-- 搜索条 -->
            <Row>
                <Col span="8">
                    <span class="searchFont">设备编号：</span>
                    <Input v-model="searchData.code" style="width: 300px" />
                </Col>
                <Col span="8">
                    <span class="searchFont">设备状态：</span>
                    <RadioGroup v-model="searchData.online">
                        <Radio label="a">不限</Radio>
                        <Radio label="y">在线</Radio>
                        <Radio label="n">离线</Radio>
                    </RadioGroup>
                </Col>
                <Col span="8">
                    <Button type="primary" icon="android-search" v-on:click="loadDevicesList">查询</Button>
                    <Button type="ghost" icon="android-refresh" style="margin-left: 20px" v-on:click="resetSearch">重置</Button>
                </Col>
            </Row>

            <!-- 添加设备按钮 -->
            <Row style="margin-top: 20px">
                <Col span="24">
                    <Button type="primary" icon="plus-round" @click="addDeviceBtnClick">添加设备</Button>
                </Col>
            </Row>

            <!-- 设备列表表头 -->
            <Row class="tableHeader">
                <Col span="3">
                    <span class="searchFont">安装时间</span>
                </Col>
                <Col span="3">
                    <span class="searchFont">设备编号</span>
                </Col>
                <Col span="9">
                    <span class="searchFont">安装地址</span>
                </Col>
                <Col span="3">
                    <span class="searchFont">设备状态</span>
                </Col>
                <Col span="6">
                    <span class="searchFont">操作</span>
                </Col>
            </Row>

            <!-- 设备列表内容 -->
            <Row :key="item.id" v-for="item in devicesList" class="tableContent">
                <Col span="3">
                    {{item.install_time}}
                </Col>
                <Col span="3">
                    {{item.code}}
                </Col>
                <Col span="9">
                    {{item.install_address}}
                </Col>
                <Col span="3">
                    <span style="color: #52c41a" v-if="item.online === 'y'">在线</span>
                    <span style="color: red" v-if="item.online === 'n'">离线</span>
                </Col>
                <Col span="6">
                    <CallDevice :deviceCode="item.code" :online="item.online" @reloadDeviceList="loadDevicesList"></CallDevice>
                </Col>
            </Row>

            <!-- 分页插件 -->
            <Row style="margin-top: 20px;text-align: center">
                <Col span="24">
                    <Page :total="total" :current="searchData.page" size="small" show-elevator show-sizer show-total v-on:on-change="pageChange" v-on:on-page-size-change="pageSizeChange"></Page>
                </Col>
            </Row>

            <!-- 添加设备表单 -->
            <Modal v-model="showDeviceForm" title="添加设备">
                <Form ref="addDeviceFormRef" :model="deviceForm" :label-width="80" :rules="deviceFormValidateRules" >
                    <FormItem label="安装日期">
                        <DatePicker type="date" format="yyyy-MM-dd" placeholder="不选择则默认为当前日期" v-model="deviceForm.install_time"></DatePicker>
                    </FormItem>
                    <FormItem label="设备编号" prop="code">
                        <Input v-model="deviceForm.code" />
                    </FormItem>
                    <FormItem label="安装地址" prop="install_address">
                        <Input v-model="deviceForm.install_address" type="textarea" :autosize="{minRows: 2,maxRows: 5}" />
                    </FormItem>
                    <FormItem label="备注">
                        <Input v-model="deviceForm.description" type="textarea" :autosize="{minRows: 2,maxRows: 5}" />
                    </FormItem>
                </Form>
                <div slot="footer">
                    <Button type="success" size="large" @click="addDeviceSubmit">添加</Button>
                </div>
            </Modal>

        </div>
    </div>
</template>

<script>

    import CallDevice from "./CallDevice";
    export default {
        name: "DevicesList",
        //数据模版
        data() {
            return {
                searchData: {
                    code: null,
                    online: 'a',
                    page: 1,
                    pageSize: 10
                },
                showDeviceForm: false,
                deviceForm: {
                    code: null,
                    install_address: null,
                    install_time: null,
                    description: null
                },
                total: 0,
                devicesList: [],
                deviceFormValidateRules: {
                    code: [
                        { required: true, message: '请输入设备编号', trigger: 'blur' },
                    ],
                    install_address: [
                        { required: true, message: '请输入安装地址', trigger: 'blur' }
                    ]
                }
            }
        },
        //组件属性
        props: {},
        //计算属性
        computed: {},
        //组件创建后回调
        created() {

        },
        //组件监听
        watch: {},
        //方法
        methods: {
            /**
             * 加载设备列表数据
             */
            loadDevicesList(){
                let app = this;
                app.$axios.get("/devices",{
                    params: app.searchData
                }).then(res => {
                    if(res.data.success){
                        app.devicesList = res.data.data.rows;
                        app.total = res.data.data.total;
                    }
                }).catch(e => {
                    console.log(e)
                })
            },

            /**
             * 分页大小变化
             */
            pageSizeChange(size){
                this.searchData.pageSize = size;
                this.loadDevicesList();
            },

            /**
             * 页数变化
             */
            pageChange(page){
                this.searchData.page = page;
                this.loadDevicesList();
            },

            /**
             * 重置按钮点击
             */
            resetSearch(){
                this.searchData.code = null;
                this.searchData.online = 'a';
                this.searchData.page = 1;
                this.searchData.pageSize = 10;
                this.loadDevicesList();
            },

            /**
             * 添加设备按钮点击
             */
            addDeviceBtnClick(){
                this.deviceForm.code = null;
                this.deviceForm.install_address = null;
                this.deviceForm.install_time = null;
                this.deviceForm.description = null;
                this.showDeviceForm = true;
            },

            /**
             * 添加设备
             */
            addDeviceSubmit(){
                let app = this;
                app.$refs['addDeviceFormRef'].validate(res => {
                    if(res){
                        let install_time = app.deviceForm.install_time;
                        if(!install_time){
                            install_time = new Date();
                        }
                        let month = (install_time.getMonth() + 1) < 10 ? '0'+(install_time.getMonth() + 1) : (install_time.getMonth() + 1);
                        app.deviceForm.install_time = `${install_time.getFullYear()}-${month}-${install_time.getDate()}`;
                        app.$axios.post("/device",app.deviceForm)
                            .then(res => {
                                if(res.data.success){
                                    app.showDeviceForm = false;
                                    app.loadDevicesList();
                                    this.$Message.success(res.data.message);
                                }else{
                                    this.$Message.error(res.data.message);
                                }
                            })
                            .catch(e => {
                                this.$Message.error("添加失败",e);
                            })
                    }
                })
            }
        },
        //组件加载完毕执行方法
        mounted: function () {
            this.loadDevicesList();
        },
        //引入组件
        components: {
            CallDevice
        }
    }
</script>

<style scoped>

    .header{
        height: 100px;
        width: 100%;
        padding: 40px 0 20px 20px;
        background-color: #fff;
    }

    .header_font{
        font-size: 30px;
    }

    .content{
        margin: 24px;
        background-color: #fff;
        padding: 30px;
    }

    .searchFont{
        font-size: 14px;
    }

    .tableHeader{
        margin-top: 20px;
        padding: 15px 0 15px 5px;
        background-color: #fafafa;
        border-radius: 4px;
        border-bottom: 1px #f0f2f5 solid;
    }

    .tableContent{
        padding: 15px 0 15px 5px;
        border-bottom: 1px #f0f2f5 solid;
    }

</style>